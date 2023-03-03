// Get form and form elements
const form = document.querySelector("form");
const passwordInput = form.querySelector("#password");
const confirmPasswordInput = form.querySelector("#confirm-password");

// Add event listener to form submit
form.addEventListener("submit", function (event) {
  // Prevent form submission
  event.preventDefault();

  // Validate password strength
  if (!validatePasswordStrength(passwordInput.value)) {
    showErrorMessage("Password is too weak.");
    return;
  }

  // Validate password match
  if (passwordInput.value !== confirmPasswordInput.value) {
    showErrorMessage("Passwords do not match.");
    return;
  }

  // Create account
  createAccount(
    {
      username: form.querySelector("#username").value,
      email: form.querySelector("#email").value,
      password: passwordInput.value,
    },
    function (error) {
      if (error) {
        showErrorMessage(error);
      } else {
        window.location.href = "/dashboard";
      }
    }
  );
});

// Function to validate password strength
function validatePasswordStrength(password) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(password);
}

// Function to show error message
function showErrorMessage(message) {
  const errorDiv = form.querySelector(".error");
  errorDiv.innerText = message;
  errorDiv.style.display = "block";
}

// Function to create account
function createAccount(data, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/create-account");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.status === 200) {
      callback(null);
    } else {
      callback(xhr.responseText);
    }
  };
  xhr.send(JSON.stringify(data));
}
