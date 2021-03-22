#version 460
#extension GL_GOOGLE_include_directive : require
#extension GL_EXT_nonuniform_qualifier : require
#extension GL_EXT_scalar_block_layout : require

#include "../common.glsl"

layout(set = 0, binding = 2, scalar) buffer Primitives { Primitive primitives[]; };
layout(set = 0, binding = 4) uniform sampler2D textures[];
layout(set = 2, binding = 0) uniform PFD { PerFrameData pfd; };
layout(push_constant) uniform PushConstants {
	int object_id;
} pc;

layout(location = 0) in vec3 in_world_space_pos;
layout(location = 1) in vec3 in_normal;
layout(location = 2) in vec4 in_tangent;
layout(location = 3) in vec2 in_uv;
layout(location = 4) in vec4 in_reprojected_pos;

layout(location = 0) out vec4 out_pos;
layout(location = 1) out vec4 out_normal;
layout(location = 2) out vec4 out_albedo;
layout(location = 3) out vec4 out_reprojected_uv_and_object_id;

void main() {
	Primitive primitive = primitives[pc.object_id];

	vec4 albedo = texture(textures[primitive.material.base_color_texture], in_uv); 
	if(primitive.material.alpha_mask == 1 && albedo.a < primitive.material.alpha_cutoff) {
		discard;
	}

	out_pos = vec4(in_world_space_pos, 1.0);
	vec3 N = in_normal;
	if(primitive.material.normal_map >= 0) {
		vec3 tangent_space_normal = normalize(texture(textures[primitive.material.normal_map], in_uv).xyz * 2.0 - 1.0);
		vec3 bitangent = cross(tangent_space_normal, in_tangent.xyz) * in_tangent.w;
		vec3 tangent = normalize(in_tangent.xyz - in_normal * dot(in_tangent.xyz, in_normal));
		N = tangent * tangent_space_normal.x + bitangent * tangent_space_normal.y + in_normal * tangent_space_normal.z;
	}
	out_normal = vec4(N, 1.0);
	out_albedo = albedo;

	vec2 reprojected_uv = 0.5 * (in_reprojected_pos.xy / in_reprojected_pos.w) + 0.5;
	out_reprojected_uv_and_object_id = vec4(reprojected_uv, pc.object_id, 1.0);
}

