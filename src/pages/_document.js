import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html style={{ margin: 0, padding: 0 }}>
      <Head />
      <body style={{ margin: 0, padding: 0, width: '100%', overflow: 'hidden' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
