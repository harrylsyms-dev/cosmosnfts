import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
  message?: string;
}

function Error({ statusCode, message }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">
          {statusCode === 404 ? '🔭' : '💥'}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {statusCode
            ? `Error ${statusCode}`
            : 'Client Error'}
        </h1>
        <p className="text-gray-400 mb-6">
          {message || (statusCode === 404
            ? 'This page could not be found.'
            : 'An error occurred on the client.')}
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
