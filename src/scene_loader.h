#pragma once

class ResourceManager;
namespace SceneLoader {
Scene LoadScene(ResourceManager &resource_manager, const char *path);
}

