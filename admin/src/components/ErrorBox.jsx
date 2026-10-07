export default function ErrorBox({ message, onRetry }) {
  return (
    <div className="border border-maroon/30 bg-maroon/5 p-6 text-center">
      <p className="text-maroon">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-4">Try again</button>}
    </div>
  );
}
