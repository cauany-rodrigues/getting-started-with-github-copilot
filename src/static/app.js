document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
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

const ensureParticipantsSection = (card) => {
  let section = card.querySelector(".participants-section");
  if (section) return section;

  const anchor =
    card.querySelector(".activity-availability") ||
    card.querySelector(".activity-schedule")?.parentElement;

  section = document.createElement("div");
  section.className = "participants-section";
  section.innerHTML = `
    <h5>Participants</h5>
    <ul class="participants-list">
      <li class="participants-empty">Sem participantes</li>
    </ul>
  `;

  if (anchor) {
    anchor.insertAdjacentElement("afterend", section);
  } else {
    card.appendChild(section);
  }
  return section;
};

const renderParticipants = (card, participants = []) => {
  const section = ensureParticipantsSection(card);
  const ul = section.querySelector(".participants-list");
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
    li.textContent = email;
    ul.appendChild(li);
  });
};

// Dentro do ponto onde o card é montado/atualizado:
// renderParticipants(card, data.participants || []);
