import '../styles/header.scss';
import { Link } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const handleLogout = async () => {
  await signOut(auth);
  localStorage.removeItem("username");
};

const Header = ({ userData }) => {
  return (
    <header>
      <div className="header">

        <div className='header-link'>
          <h2>lien compte tiktok</h2>
        </div>

        <div className='header-banner'>
          <h1>MANGA LORE</h1>
        </div>

        <div className="login-header">
          {!userData?.isLoggedIn ? (
            <>
              <Link to="/register">
                <button>Signup</button>
              </Link>
              <Link to="/login">
                <button>Login</button>
              </Link>
            </>
          ) : (
            <div className="user-info">
              <span className="username">
                {userData.username}
              </span>

              <span className={`status ${userData.isPremium ? "premium" : "free"}`}>
                {userData.isPremium ? "Premium" : "Free"}
              </span>

              <button onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
      
      <div className='header-separate'></div>
    </header>

  )
}

export default Header