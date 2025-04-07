"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

type ToastMessage = {
  id: string;
  title: string;
  body: string;
  icon?: string;
};

const ToastContext = createContext<{
  showToast: (title: string, body: string, icon?: string) => void;
}>({
  showToast: () => {},
});

const ToastItem: React.FC<{
  message: ToastMessage;
  onClose: VoidFunction;
}> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="dark:bg-white bg-gray-800 rounded-lg shadow-lg p-4 mb-3 flex items-start w-full max-w-md z-40 animate-fadeIn pointer-events-auto">
      {message.icon && (
        <img
          src={message.icon}
          alt=""
          className="w-10 h-10 shrink-0 mr-3 rounded-md"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-white dark:text-gray-900 truncate">
          {message.title}
        </h4>
        <p className="text-xs dark:text-gray-600 text-gray-300 line-clamp-2">
          {message.body}
        </p>
      </div>
      <button
        onClick={onClose}
        className="ml-2 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <Image
          src="/close.svg"
          width={16}
          height={16}
          alt="Close"
          className="invert dark:invert-0"
        />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  const showToast = useCallback(
    (title: string, body: string, icon?: string) => {
      const id = Date.now().toString();
      setMessages((prev) => [...prev, { id, title, body, icon }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 left-1/2 -translate-x-1/2 p-4 z-40 flex flex-col items-center space-y-3 w-full max-w-md pointer-events-none">
            {messages.map((message) => (
              <ToastItem
                key={message.id}
                message={message}
                onClose={() => removeToast(message.id)}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
