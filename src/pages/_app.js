import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ margin: 0, padding: 0, width: '100%', overflow: 'hidden' }}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
