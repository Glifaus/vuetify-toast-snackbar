import Toast from "./Toast.vue";

function init(Vue, globalOptions = {}) {
  let currentToastInstance = null;
  const toastQueue = [];
  const defaultProperty = globalOptions.property || "$toast";

  function createToastInstance(options) {
    const toastComponent = new Vue(Toast);
    const finalOptions = {
      ...Vue.prototype[defaultProperty].globalOptions,
      ...options,
    };

    if (finalOptions.slot) {
      toastComponent.$slots.default = finalOptions.slot;
      delete finalOptions.slot;
    }

    Object.assign(toastComponent, finalOptions);
    document.body.appendChild(toastComponent.$mount().$el);

    return toastComponent;
  }

  function showToast(message, options = {}) {
    if (currentToastInstance) {
      const isQueueable =
        options.queueable !== undefined
          ? options.queueable
          : globalOptions.queueable;

      if (isQueueable) {
        toastQueue.push({ message, options });
      } else {
        currentToastInstance.close();
        toastQueue.unshift({ message, options });
      }

      return;
    }

    options.message = message;
    currentToastInstance = createToastInstance(options);
    currentToastInstance.$on("statusChange", (isActive, wasActive) => {
      if (wasActive && !isActive) {
        currentToastInstance.$nextTick(() => {
          currentToastInstance.$destroy();
          currentToastInstance = null;

          if (toastQueue.length) {
            const nextToast = toastQueue.shift();
            showToast(nextToast.message, nextToast.options);
          }
        });
      }
    });
  }

  function createShortcutMethods(options) {
    const colors = ["success", "info", "error", "warning"];
    const shortcutMethods = {};

    colors.forEach((color) => {
      shortcutMethods[color] = (message, opts) =>
        showToast(message, { color, ...opts });
    });

    if (options.shorts) {
      Object.entries(options.shorts).forEach(([key, localOptions]) => {
        shortcutMethods[key] = (message, opts) =>
          showToast(message, { ...localOptions, ...opts });
      });
    }

    return shortcutMethods;
  }

  Vue.prototype[defaultProperty] = {
    ...createShortcutMethods(globalOptions),
    globalOptions,
    show: showToast,
    getCmp: () => currentToastInstance,
    clearQueue: () => toastQueue.splice(0, toastQueue.length),
  };
}

if (typeof window !== "undefined" && window.Vue) {
  window.Vue.use(init);
}

export default init;
