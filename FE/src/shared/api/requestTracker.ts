const controllers = new Set<AbortController>()

export const trackRequest = (controller: AbortController) => {
  controllers.add(controller)
}

export const releaseRequest = (controller: AbortController) => {
  controllers.delete(controller)
}

export const abortAllRequests = () => {
  controllers.forEach(controller => controller.abort())
  controllers.clear()
}
