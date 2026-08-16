export default function Footer() {
  return (
    <footer className="snake-footer">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <span>
          © {new Date().getFullYear()} <strong>tvimogame</strong>
        </span>
        <span className="snake-footer-tag">Snake · React + Bootstrap</span>
      </div>
    </footer>
  )
}
