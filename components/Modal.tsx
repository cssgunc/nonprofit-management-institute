import React from 'react';

type propTypes = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<propTypes> = ({open, onClose, children}) => {
    return (
        <div 
            onClick = {onClose}
            className={`fixed inset-0 flex justify-center items-center transition-colors ${open ? "visible bg-black/20" : "invisible"}`}
        >
            <div
                className={`bg-white p-6 shadow transition-all max-w-md ${open ? "scale-100 opacity-100" : "scale-110 opacity-0"}`}
                onClick = {(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export default Modal;