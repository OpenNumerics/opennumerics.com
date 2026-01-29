document.addEventListener("DOMContentLoaded", () => {
  const projects = [
    {
      title: "Optimal Control of Chemical Reactors",
      link: "/solutions/chemical.html",
      description: "PDE Constrained Optimization for Optimal Control of a Gas Reactor",
      image: "images/chemical/chemical_tile.png"
    },
    {
      title: "Digital Twin for Elastic Deformations",
      link: "/solutions/elasticity.html",
      description: "Physics-informed AI model for predicting metallic deformations",
      image: "images/elasticity.png"
    },
    {
      title: "Uncertainty-Aware Parameter Estimation for Materials",
      link: "/solutions/bayesian.html",
      description: "Robust Bayesian Optimization and Uncertainty Quantification for Linear Elasticity",
      image: "images/Bayes.png"
    },
    {
      title: "Bifurcation Toolkit for PDEs and ML Models",
      link: "/solutions/bifurcation.html",
      description: "Lightweight Python API for numerical continuation and bifurcation detection",
      image: "images/pycont.png"
    },
    {
      title: "Fast Exploration of Physical Designs using Generative AI",
      link: "/solutions/sgm.html",
      description: "The first Industrial GenAI Model for Computational Science",
      image: "images/sgm/sgm_tile.png"
    },
    {
      title: "Enhanced Sampling for Molecular Dynamics",
      link: "/solutions/sampling.html",
      description: "New multifidelity sampling algorithm for improved molecular structure predition",
      image: "images/alanine_dipeptide.png"
    },
  ];

  const gridContainer = document.getElementById("projects-grid");

  projects.forEach((project) => {
    const gridItem = document.createElement("a");
    gridItem.href = project.link;
    gridItem.className = "grid-item";

    const title = document.createElement("h2");
    title.textContent = project.title;
    gridItem.appendChild(title);

    const image = document.createElement("img");
    image.src = project.image;
    image.alt = project.description;
    image.loading = "lazy";
    gridItem.appendChild(image);

    const description = document.createElement("p");
    description.textContent = project.description;
    gridItem.appendChild(description);

    gridContainer.appendChild(gridItem);
  });

  const titles = document.querySelectorAll('#projects-grid h2');
  const tallest = Math.max(...[...titles].map(t => t.offsetHeight));
  titles.forEach(t => t.style.minHeight = tallest + 'px');
});