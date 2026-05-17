import { useEffect, useState } from "react";

export default function DeferredToaster() {
  const [Toaster, setToaster] = useState(null);

  useEffect(() => {
    const loadToaster = () => {
      import("react-hot-toast").then((module) => {
        setToaster(() => module.Toaster);
      });
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(loadToaster, {
        timeout: 2000,
      });

      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(loadToaster, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return Toaster ? <Toaster position="top-right" /> : null;
}
