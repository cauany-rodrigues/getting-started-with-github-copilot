document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const renderParticipants = (card, activityName, participants = []) => {
    const ul = card.querySelector(".participants-list");
    if (!ul) return;
    ul.innerHTML = "";

    if (participants.length === 0) {
      const li = document.createElement("li");
      li.className = "participants-empty";
      li.textContent = "Sem participantes";
      ul.appendChild(li);
      return;
    }

    participants.forEach((email) => {
      const li = document.createElement("li");
      li.className = "participant-item";

      const emailSpan = document.createElement("span");
      emailSpan.className = "participant-email";
      emailSpan.textContent = email;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "participant-remove";
      removeButton.setAttribute("aria-label", `Unregister ${email}`);
      removeButton.innerHTML = "&times;";

      removeButton.addEventListener("click", async () => {
        removeButton.disabled = true;
        removeButton.classList.add("is-loading");
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
            { method: "DELETE" }
          );

          if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.detail || "Failed to unregister participant");
          }

          await fetchActivities(activityName);
        } catch (error) {
          removeButton.disabled = false;
          removeButton.classList.remove("is-loading");
          alert(error.message || "Failed to unregister participant");
        }
      });

      li.appendChild(emailSpan);
      li.appendChild(removeButton);
      ul.appendChild(li);
    });
  };

  const renderCard = (name, details) => {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;

    activityCard.innerHTML = `
      <h4>${name}</h4>
      <p>${details.description || ""}</p>
      <p><strong>Schedule:</strong> ${details.schedule || ""}</p>
      <p class="activity-availability"><span class="label">Availability:</span> ${spotsLeft} spots left</p>
      <div class="participants-section">
        <h5>Participants</h5>
        <ul class="participants-list"></ul>
      </div>
    `;

    renderParticipants(activityCard, name, details.participants || []);
    activitiesList.appendChild(activityCard);
  };

  // Function to fetch activities from API
  async function fetchActivities(preferredSelection) {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      const selectedValue = preferredSelection ?? activitySelect.value;
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        renderCard(name, details);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (name === selectedValue) {
          option.selected = true;
        }
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities(activity);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
