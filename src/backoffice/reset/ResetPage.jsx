import { useEffect, useState } from "react";

import {
  fetchResources,
  resetResources,
} from "../../services/resetService";



export default function ResetPage() {

  const [resources, setResources] = useState([]);

  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(false);



  // =============================
  // LOAD RESSOURCES
  // =============================
  useEffect(() => {

    loadResources();

  }, []);




  async function loadResources() {

    const data = await fetchResources();

    setResources(data);
  }



  // =============================
  // CHECKBOX
  // =============================
  function toggleResource(name) {

    if (selected.includes(name)) {

      setSelected(
        selected.filter((r) => r !== name)
      );

    } else {

      setSelected([...selected, name]);
    }
  }



  // =============================
  // SELECT ALL
  // =============================
  function selectAll() {

    setSelected(
      resources.map((r) => r.name)
    );
  }



  // =============================
  // UNSELECT ALL
  // =============================
  function unselectAll() {

    setSelected([]);
  }



  // =============================
  // RESET
  // =============================
  async function handleReset() {

    if (selected.length === 0) {
      alert("Aucune ressource sélectionnée");
      return;
    }

    const confirmReset = window.confirm(
      "Voulez-vous vraiment réinitialiser ces ressources ?"
    );

    if (!confirmReset) return;

    setLoading(true);

    await resetResources(selected);

    setLoading(false);

    alert("RESET TERMINÉ");
  }



  return (
    <div style={{ padding: "20px" }}>

      <h1>RESET DATA</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={selectAll}>
          Select All
        </button>

        <button
          onClick={unselectAll}
          style={{ marginLeft: "10px" }}
        >
          Unselect All
        </button>
      </div>



      {
        resources.map((resource) => (

          <div
            key={resource.name}
            style={{
              marginBottom: "10px",
            }}
          >

            <input
              type="checkbox"
              checked={selected.includes(resource.name)}
              onChange={() =>
                toggleResource(resource.name)
              }
            />

            <span style={{ marginLeft: "10px" }}>
              {resource.name}
            </span>

          </div>
        ))
      }



      <button
        onClick={handleReset}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
        }}
      >
        {
          loading
            ? "RESET EN COURS..."
            : "RESET"
        }
      </button>

    </div>
  );
}