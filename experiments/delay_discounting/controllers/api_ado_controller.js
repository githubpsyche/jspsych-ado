function createApiAdoController(config, api_base) {
  let session_id = null;

  async function post(path, body) {
    const response = await fetch(`${api_base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();
  }

  return {
    start: async function(context) {
      const result = await post("/ado/sessions", {
        config,
        context,
      });
      session_id = result.session_id;
      return result;
    },

    update: async function(trial_data) {
      return await post(`/ado/sessions/${session_id}/update`, {
        trial_data,
        design: trial_data.ado_design,
        response: {
          choice: trial_data.choice,
        },
      });
    }
  };
}

export { createApiAdoController };

