import '../styles/modal-avatar.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

function ModalAvatar({ avatarOptions, selectedAvatar, onSelect, onClose }) {
  return (
    <div className="modal-avatar-overlay" onClick={onClose}>
      <div className="modal-avatar-panel" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-grid">
          {avatarOptions.map(({ name, src }) => (
            <img
              key={name}
              src={src}
              alt={name}
              className={`avatar-thumb ${selectedAvatar === name ? 'selected' : ''}`}
              onClick={() => {
                onSelect(name);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModalAvatar;