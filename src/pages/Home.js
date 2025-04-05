import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome to <span style={{ color: '#3B82F6' }}>Athlinko</span> 🏅</h1>
      <p style={styles.subheading}>
        Connecting Athletes & Coaches from all over India.<br />
        Discover talent. Get trained. Get noticed.
      </p>

      <div style={styles.buttonContainer}>
        <Link to="/register" style={{ ...styles.button, backgroundColor: '#3B82F6' }}>Join Now</Link>
        <Link to="/login" style={{ ...styles.button, backgroundColor: '#10B981' }}>Login</Link>
      </div>

      <img
        src="https://c1.staticflickr.com/1/578/21820499801_7cb12b1043_b.jpg"
        alt="Athletes"
        style={styles.image}
      />
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'center',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    fontSize: '2.8rem',
    marginBottom: '1rem',
  },
  subheading: {
    fontSize: '1.2rem',
    color: '#555',
    marginBottom: '2rem',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  button: {
    padding: '0.8rem 2rem',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
  },
  image: {
    maxWidth: '100%',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    marginTop: '1.5rem',
  },
};

export default Home;
