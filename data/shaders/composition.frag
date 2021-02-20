#version 460
#extension GL_GOOGLE_include_directive : require

#include "common.glsl"

layout(set = 1, binding = 0) uniform PerFrameData {
	mat4 camera_view;
	mat4 camera_proj;
	mat4 camera_view_inverse;
	mat4 camera_proj_inverse;
	DirectionalLight directional_light;
	float split_view_anchor;
} pfd;

layout(set = 2, binding = 0) uniform sampler2D position_texture;
layout(set = 2, binding = 1) uniform sampler2D normal_texture;
layout(set = 2, binding = 2) uniform sampler2D albedo_texture;
layout(set = 2, binding = 3) uniform sampler2D rays_texture;

layout(location = 0) in vec2 in_uv;
layout(location = 0) out vec4 out_color;

void main() {
	if(in_uv.x < (pfd.split_view_anchor - ANCHOR_WIDTH)) {
		// vec3 position = texture(position_texture, in_uv).rgb;
		vec3 normal = texture(normal_texture, in_uv).rgb;
		vec3 albedo = texture(albedo_texture, in_uv).rgb;

		vec3 light_dir = -pfd.directional_light.direction.xyz;
		vec3 light_color = pfd.directional_light.color.rgb;

		vec3 diffuse_lighting = 0.4 * albedo + max(dot(normal, light_dir), 0.0) * albedo * light_color;
		out_color = vec4(diffuse_lighting, 1.0);
	}
	else if(in_uv.x < (pfd.split_view_anchor + ANCHOR_WIDTH)) {
		out_color = vec4(1.0, 0.0, 0.0, 1.0);
	}
	else {
		out_color = texture(rays_texture, in_uv);
	}
}

