export default function ColDots({ count, active }) {
  return (
    <div className="col-dots">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`col-dot-ind${i === active ? " active" : ""}`} />
      ))}
    </div>
  );
}
