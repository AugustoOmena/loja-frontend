import { User } from "lucide-react";

export const MyData = () => {
  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "20px",
          color: "#1e293b",
        }}
      >
        Meus Dados
      </h2>
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={30} color="#64748b" />
          </div>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>
              Usuário Exemplo
            </div>
            <div style={{ color: "#64748b" }}>cliente@email.com</div>
          </div>
        </div>
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            border: "1px dashed #cbd5e1",
            color: "#64748b",
          }}
        >
          Aqui ficará o formulário para editar nome, CPF e telefone.
        </div>
      </div>
    </div>
  );
};
