searchForm = document.querySelector(".search-form");

document.querySelector("#search-btn").onclick = () => {
  searchForm.classList.toggle("active");
};

let loginForm = document.querySelector(".login-form-container");

// document.querySelector('#login-btn').onclick = () =>{
//   loginForm.classList.toggle('active');
// }
let user; // This should be replaced with the actual user session check

fetch("/get-user", {
  method: "GET",
  credentials: "include", // This is required to include the session cookie
})
  .then((response) => response.json())
  .then((data) => {
    user = data.user;
  })
  .catch((error) => console.error("Error:", error));

document.querySelector("#login-btn").onclick = () => {
  if (user) {
    toggleDropdown();
  } else {
    loginForm.classList.toggle("active");
  }
};

document.querySelector("#close-login-btn").onclick = () => {
  loginForm.classList.remove("active");
};

window.onscroll = () => {
  searchForm.classList.remove("active");

  if (window.scrollY > 80) {
    document.querySelector(".header .header-2").classList.add("active");
  } else {
    document.querySelector(".header .header-2").classList.remove("active");
  }
};

window.onload = () => {
  if (window.scrollY > 80) {
    document.querySelector(".header .header-2").classList.add("active");
  } else {
    document.querySelector(".header .header-2").classList.remove("active");
  }

  fadeOut();
};

function loader() {
  document.querySelector(".loader-container").classList.add("active");
}

function fadeOut() {
  setTimeout(loader, 4000);
}

var swiper = new Swiper(".books-slider", {
  loop: true,
  centeredSlides: true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

var swiper = new Swiper(".featured-slider", {
  spaceBetween: 10,
  loop: true,
  centeredSlides: true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    450: {
      slidesPerView: 2,
    },
    768: {
      slidesPerView: 3,
    },
    1024: {
      slidesPerView: 4,
    },
  },
});

var swiper = new Swiper(".arrivals-slider", {
  spaceBetween: 10,
  loop: true,
  centeredSlides: true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

var swiper = new Swiper(".reviews-slider", {
  spaceBetween: 10,
  grabCursor: true,
  loop: true,
  centeredSlides: true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

var swiper = new Swiper(".blogs-slider", {
  spaceBetween: 10,
  grabCursor: true,
  loop: true,
  centeredSlides: true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

function toggleDropdown() {
  // console.log('toggleDropdown function called');
  var dropdown = document.getElementById("account-options");
  if (dropdown.style.display === "none") {
    dropdown.style.display = "block";
  } else {
    dropdown.style.display = "none";
  }
}

//
function subscribe() {
  const emailInput = document.getElementById("email");
  const email = emailInput.value;
  // console.log(email);
  // console.log(emailInput);

  if (validateEmail(email)) {
    // Send the email to the server for subscription
    fetch("/auth/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        emailInput.value = "";
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    // console.log("done")
  } else {
    alert("Please enter a valid email address.");
  }
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// function fetchReviews() {
//   fetch("/reviews") // Update the URL with the actual endpoint for fetching reviews
//     .then((response) => response.json())
//     .then((data) => {
//       // Assuming the response contains an array of review objects
//       const reviews = data.reviews;

//       // Select the reviews slider element
//       const reviewsSlider = document.querySelector(".reviews-slider");

//       // Clear existing reviews
//       reviewsSlider.innerHTML = "";

//       // Iterate over the reviews and create HTML elements to display each review
//       reviews.forEach((review) => {
//         const reviewElement = document.createElement("div");
//         reviewElement.classList.add("swiper-slide", "box");
//         reviewElement.innerHTML = `
//           <img src="${review.image}" alt="${review.author}">
//           <h3>${review.author}</h3>
//           <p>${review.comment}</p>
//           <div class="stars">
//             ${generateStarRating(review.rating)}
//           </div>
//         `;

//         // Append the review element to the reviews slider
//         reviewsSlider.appendChild(reviewElement);
//       });
//     })
//     .catch((error) => {
//       console.error("Error fetching reviews:", error);
//     });
// }

// function generateStarRating(rating) {
//   const maxRating = 5;
//   let starsHTML = "";
//   for (let i = 0; i < maxRating; i++) {
//     if (i < rating) {
//       starsHTML += `<i class="fas fa-star"></i>`;
//     } else {
//       starsHTML += `<i class="far fa-star"></i>`;
//     }
//   }
//   return starsHTML;
// }

// // Call fetchReviews when the DOM is loaded
// document.addEventListener("DOMContentLoaded", fetchReviews);
