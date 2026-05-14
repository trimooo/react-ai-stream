// jsdom does not implement scrollIntoView — mock it globally
Element.prototype.scrollIntoView = () => {}
