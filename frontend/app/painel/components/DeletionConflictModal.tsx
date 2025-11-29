"use client";

export type ConflictItem = {
  type: string;
  label?: string;
  count: number;
  samples?: string[];
};

export type DeletionBlockInfo = {
  title?: string;
  message: string;
  conflicts: ConflictItem[];
};

export function DeletionConflictModal({ info, onClose }: { info: DeletionBlockInfo; onClose: () => void }) {
  const { title = "Exclusao bloqueada", message, conflicts } = info;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: 12,
      }}
      role="dialog"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 18,
          width: "min(640px, 100%)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
          style={{
            border: "none",
            background: "none",
            fontSize: 16,
            color: "#6b7280",
            cursor: "pointer",
            padding: 4,
          }}
          aria-label="Fechar modal"
        >
          x
        </button>
      </div>

        <p style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>{message}</p>

        {Array.isArray(conflicts) && conflicts.length > 0 ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 12,
              background: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {conflicts.map((conflict) => {
              const remaining = Number.isFinite(conflict.count)
                ? Math.max(0, conflict.count - (conflict.samples?.length || 0))
                : 0;
              return (
                <div
                  key={conflict.type}
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    padding: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>
                      {conflict.label || conflict.type}
                    </div>
                    <div style={{ fontSize: 12, color: "#4b5563" }}>
                      {conflict.count ?? 0} {conflict.count === 1 ? "registro" : "registros"}
                    </div>
                  </div>
                  {conflict.samples && conflict.samples.length > 0 ? (
                    <ul style={{ margin: "6px 0 0", paddingLeft: 16, color: "#111827", fontSize: 12, lineHeight: 1.5 }}>
                      {conflict.samples.map((sample, idx) => (
                        <li key={`${conflict.type}-${idx}`}>{sample}</li>
                      ))}
                      {remaining > 0 ? <li>+ {remaining} outros</li> : null}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 12 }}>
          Remova ou inative os registros acima para concluir a exclusao.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "#0f172a",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
