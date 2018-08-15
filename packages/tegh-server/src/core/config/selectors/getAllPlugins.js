import getPluginManager from './getPluginManager'

// returns a plain js object
const getAllPlugins = (config) => {
  const manager = getPluginManager(config)
  if (!manager.isReady()) {
    const err = 'Attempted to load plugins before plugin manager'
    throw new Error(err)
  }

  return manager.pluginCache
}

export default getAllPlugins
