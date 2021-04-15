#version 460
#extension GL_GOOGLE_include_directive : require
#include "../common.glsl"
#include "../../../src/rendering_backend/glsl_common.h"

layout(constant_id = SHADOW_MODE_SPEC_CONST_INDEX) const int shadow_mode = 0;
layout(constant_id = AMBIENT_OCCLUSION_MODE_SPEC_CONST_INDEX) const int ambient_occlusion_mode = 0;
layout(constant_id = REFLECTION_MODE_SPEC_CONST_INDEX) const int reflection_mode = 0;

layout(set = 3, binding = 0) uniform sampler2D position_texture;
layout(set = 3, binding = 1) uniform sampler2D normal_texture;
layout(set = 3, binding = 2) uniform sampler2D albedo_texture;
layout(set = 3, binding = 3) uniform sampler2D shadow_map;
layout(set = 3, binding = 4) uniform sampler2D raytraced_shadows_texture;
layout(set = 3, binding = 5) uniform sampler2D raytraced_ambient_occlusion_texture;
layout(set = 3, binding = 6) uniform sampler2D raytraced_reflections_texture;

layout(location = 0) in vec2 in_uv;
layout(location = 0) out vec4 out_color;

void main() {
	vec4 position_and_roughness = texture(position_texture, in_uv);
	vec3 packed_normal_and_metallic = texture(normal_texture, in_uv).xyw;
	vec3 position = position_and_roughness.xyz;
	vec3 camera_position = vec3(pfd.camera_view_inverse[3].xyz);
	vec3 albedo = texture(albedo_texture, in_uv).rgb;

	vec3 V = normalize(camera_position - position);
	vec3 L = -normalize(pfd.directional_light.direction.xyz);
	vec3 N = oct_decode_to_vec3(packed_normal_and_metallic.xy);
	vec3 H = normalize(L + V);
	vec3 light_color = pfd.directional_light.color.rgb;

	vec3 shadow = vec3(1.0);
	if(shadow_mode == SHADOW_MODE_RAYTRACED) {
		shadow = texture(raytraced_shadows_texture, in_uv).rgb; 
	}
	else if(shadow_mode == SHADOW_MODE_RASTERIZED) {
		vec4 pos_lightspace = SHADOW_BIAS_MATRIX * pfd.directional_light.projview * vec4(position, 1.0);
		vec4 shadow_coord = pos_lightspace / pos_lightspace.w;
		float depth = texture(shadow_map, shadow_coord.xy).r;
		shadow = shadow_coord.z > depth + 0.003 ? vec3(0.0) : vec3(1.0);
	}

	vec3 ao = vec3(1.0);
	if(ambient_occlusion_mode == AMBIENT_OCCLUSION_MODE_RAYTRACED) {
		ao = texture(raytraced_ambient_occlusion_texture, in_uv).rgb; 
	}

	float min_roughness = 0.04;
	float roughness = clamp(position_and_roughness.w, min_roughness, 1.0);
	float metallic = clamp(packed_normal_and_metallic.z, 0.0, 1.0);
	vec3 material = material_brdf(albedo, roughness, metallic, V, L, N, H);

	float ambient_factor = 0.2;
	float light_intensity = 2.0;
	vec3 lighting = ao * albedo * ambient_factor + max(dot(N, L), 0.0) * material * light_color * shadow * light_intensity;
	
	if(reflection_mode == REFLECTION_MODE_RAYTRACED) {
		lighting += texture(raytraced_reflections_texture, in_uv).rgb * shadow;
	}

	out_color = vec4(lighting, 1.0);
}

