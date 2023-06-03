import { Dispatch, ReactNode, SetStateAction, useRef } from 'react';
import './Modal.css';

type ModalProps = {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
};

export default function Modal({ visible, setVisible, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  return (
    <>
      {visible ? (
        <div
          className="modal"
          dir="row"
          onClick={(e) => {
            if (!modalRef.current) {
              return;
            } else if (modalRef.current.contains(e.target as Node)) {
              return;
            }
            setVisible(false);
          }}
        >
          <div ref={modalRef} className="modalChild">
            {children}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
