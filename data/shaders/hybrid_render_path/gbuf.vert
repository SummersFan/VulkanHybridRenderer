#version 460
#extension GL_GOOGLE_include_directive : require
#extension GL_EXT_nonuniform_qualifier : require
#extension GL_EXT_scalar_block_layout : require

#include "../common.glsl"

layout(set = 0, binding = 2, scalar) buffer Primitives { Primitive primitives[]; };
layout(set = 2, binding = 0) uniform PFD { PerFrameData pfd; };

layout(push_constant) uniform PushConstants {
	int object_id;
} pc;

layout(location = 0) in vec3 in_pos;
layout(location = 1) in vec3 in_normal;
layout(location = 2) in vec4 in_tangent;
layout(location = 3) in vec2 in_uv0;
layout(location = 4) in vec2 in_uv1;

layout(location = 0) out vec3 out_world_space_pos;
layout(location = 1) out vec3 out_normal;
layout(location = 2) out vec4 out_tangent;
layout(location = 3) out vec2 out_uv;
layout(location = 4) out vec4 out_reprojected_pos;

void main() {
	mat4 model = primitives[pc.object_id].transform;
	
	out_world_space_pos = vec3(model * vec4(in_pos, 1.0));
	out_normal = in_normal;
	out_tangent = in_tangent;
	out_uv = in_uv0;
	// out_view_space_normal = normalize(vec3(pfd.camera_view * model * vec4(in_normal, 1.0)));

	out_reprojected_pos = (pfd.camera_proj_prev_frame * pfd.camera_view_prev_frame * model) * vec4(in_pos, 1.0);
	gl_Position = (pfd.camera_proj * pfd.camera_view * model) * vec4(in_pos, 1.0);
}

