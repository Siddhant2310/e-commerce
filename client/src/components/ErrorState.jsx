export default function ErrorState({ message, onRetry }) {
  return (
    <div className="container-x py-16">
      <div className="border border-maroon/30 bg-maroon/5 px-6 py-12 text-center">
        <h2 className="text-3xl text-maroon">We couldn't load this</h2>
        <p className="mx-auto mt-3 max-w-md text-ink/70">{message}</p>
        {onRetry && <button onClick={onRetry} className="btn-outline mt-6">Try again</button>}
      </div>
    </div>
  );
}
