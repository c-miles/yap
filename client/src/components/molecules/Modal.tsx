import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Icon } from "../atoms";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md";
  children: React.ReactNode;
}

const MAX_W = { sm: "max-w-sm", md: "max-w-md" } as const;

const Modal: React.FC<ModalProps> = ({ open, onClose, title, size = "md", children }) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as="div" className="relative z-modal" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className={`w-full ${MAX_W[size]} transform overflow-hidden rounded-lg bg-surface border border-border p-6 text-left align-middle shadow-xl transition-all`}>
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text mb-4 relative">
                {title}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="focus-ring absolute right-0 top-0 text-text-muted hover:text-text transition-colors"
                >
                  <Icon icon={X} size="md" />
                </button>
              </Dialog.Title>
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export default Modal;
