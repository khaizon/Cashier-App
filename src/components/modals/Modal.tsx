import { Dispatch, FC, ReactNode, SetStateAction, useRef } from 'react';
import './Modal.css';

type ModalProps = {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
};

const Modal: FC<ModalProps> = ({ visible, setVisible, children }) => {
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
};

export default Modal;
