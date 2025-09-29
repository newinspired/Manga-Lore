import '../styles/header.scss';
import { Link } from 'react-router-dom';


const Header = () => {
  return (
    <header>
      <div className="header">
        <div className='header-banner'>
          <h1>MANGA LORE</h1>
          <h2>One Piece part v1.0</h2>
        </div>
        <div className="login-header">
          <Link to="/login">
            <button>Login</button>
          </Link>
          <Link to="/register">
            <button>Signup</button>
          </Link>
        </div>
      </div>
      <div className='header-separate'></div>
    </header>

  )
}

export default Header