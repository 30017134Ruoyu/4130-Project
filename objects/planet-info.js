import * as THREE from "three";

class PlanetInfoSystem {
  constructor(scene, planetGroups, planetData) {
    this.scene = scene;
    this.planetGroups = planetGroups;
    this.planetData = planetData;
    this.activeCamera = null;
    this.infoElement = null;
    this.isDisplayingInfo = false;
    this.currentPlanet = null;
    
    // Detection distance threshold
    this.proximityThreshold = 5000; // Display information when the distance to the planet is less than this value
    
    // info State
    this.infoCardState = {
      isOpen: false,
      currentPlanet: null,
      transitionTimer: null
    };
    
    // create card UI
    this.createInfoCard();
    
    // Planet info: 
    this.planetInfo = {
      sun: {
        title: "Sun",
        description: "The Sun is the central body of the Solar System, accounting for 99.86% of the total mass of the Solar System. It is a G-type main sequence star with a diameter of about 1,392,000 kilometers, a surface temperature of about 5,500°C, and a core temperature of up to 15 million°C. The Sun is mainly composed of hydrogen (74%) and helium (24%), and releases energy through nuclear fusion.",
        facts: [
          "Age: About 4.6 billion years",
          "Rotation period: about 25.4 days (equator)",
          "Mass: 1.989 × 10^30 kg",
          "Time for light to reach Earth: About 8 minutes and 20 seconds"
        ]
      },
      mercury: {
        title: "Mercury",
        description: "Mercury is the planet closest to the sun and the smallest planet in the solar system. Its surface is covered with craters, and it has no satellites or atmosphere. Because it is close to the sun, the temperature difference between day and night on Mercury is extremely large, reaching 430°C during the day and dropping to -180°C at night.",
        facts: [
          "Orbital period: 88 days",
          "Rotation period: 58.6 days",
          "Average distance from the sun: 57.9 million km",
          "Diameter: 4,879 km"
        ]
      },
      venus: {
        title: "Venus",
        description: "Venus is one of the brightest objects in the solar system and is known as the 'Morning Star' or 'Evening Star'. It is surrounded by a thick carbon dioxide atmosphere, which leads to an extremely strong greenhouse effect, with surface temperatures reaching 465°C, hotter than Mercury. There are many volcanoes and lava plains on Venus.",
        facts: [
          "Orbital period: 225 days",
          "Rotation period: 243 days (reverse rotation)",
          "Average distance from the sun: 108 million km",
          "Diameter: 12,104 km"
        ]
      },
      earth: {
        title: "Earth",
        description: "Earth is the only celestial body known to support life, with 71% of its surface covered in liquid water. It has an oxygen-containing atmosphere and a protective magnetic field that protects against harmful solar winds and cosmic rays.",
        facts: [
          "Orbital period: 365.25 days",
          "Rotation period: 23 hours, 56 minutes and 4 seconds",
          "Average distance from the sun: 150 million km",
          "Diameter: 12,742 km"
        ]
      },
      mars: {
        title: "Mars",
        description: "Mars is called the 'Red Planet' because its surface is rich in iron oxide (rust). It has a thin atmosphere composed mainly of carbon dioxide. Mars has the highest volcano in the solar system, Olympus Mons, and the largest canyon in the solar system, Valles Marineris. It has two small satellites: Phobos and Deimos.",
        facts: [
          "Orbital period: 687 days",
          "Rotation period: 24 hours and 37 minutes",
          "Average distance from the sun: 228 million km",
          "Diameter: 6,779 km"
        ]
      },
      jupiter: {
        title: "Jupiter",
        description: "Jupiter is the largest planet in the Solar System, with a mass 2.5 times that of all the other planets combined. It is composed mainly of hydrogen and helium and is a gas giant. Jupiter has a famous Great Red Spot, a huge storm that has persisted for hundreds of years. There are 79 known satellites, the four largest of which are the Galilean satellites.",
        facts: [
          "Orbital period: 11.86 years",
          "Rotation period: 9 hours 55 minutes",
          "Average distance from the sun: 778 million km",
          "Diameter: 139,820 km"
        ]
      },
      saturn: {
        title: "Saturn",
        description: "Saturn is famous for its spectacular ring system, which is mainly composed of ice particles and rocky debris. Saturn is a gas giant planet with a density lower than that of water, and theoretically it would float in a large enough pool of water. There are 82 known satellites, the largest of which is Titan.",
        facts: [
          "Orbital period: 29.46 years",
          "Rotation period: 10 hours 33 minutes",
          "Average distance from the sun: 1.43 billion km",
          "Diameter: 116,460 km"
        ]
      },
      uranus: {
        title: "Uranus",
        description: "Uranus is the first planet in the solar system to be discovered through a telescope. Its rotation axis is almost perpendicular to its orbital axis, as if it is lying on its side, which may be caused by a giant collision in the early days. Uranus is an ice giant planet, mainly composed of hydrogen, helium and 'ice' containing water, ammonia and methane.",
        facts: [
          "Orbital period: 84.01 years",
          "Rotation period: 17 hours and 14 minutes (reverse rotation)",
          "Average distance from the sun: 2.87 billion km",
          "Diameter: 50,724 km"
        ]
      },
      neptune: {
        title: "Neptune",
        description: "Neptune is the most distant planet in the Solar System, discovered through mathematical calculations rather than direct observation. It is an ice giant with a strong storm system, the most famous of which is the 'Great Dark Spot'. Neptune has 14 known satellites, the largest of which is Triton.",
        facts: [
          "Orbital period: 164.8 years",
          "Rotation period: 16 hours and 6 minutes",
          "Average distance from the sun: 4.5 billion km",
          "Diameter: 49,244 km"
        ]
      }
    };
  }
  
  createInfoCard() {
    // create card info
    const infoCard = document.createElement('div');
    infoCard.id = 'planet-info-card';
    infoCard.style.cssText = `
      position: fixed;
      bottom: -400px; 
      left: 50%;
      transform: translateX(-50%);
      width: 450px;
      max-height: 350px;
      background-color: rgba(0, 0, 0, 0.85);
      color: white;
      border-radius: 10px;
      padding: 20px;
      font-family: Arial, sans-serif;
      box-shadow: 0 0 20px rgba(0, 100, 255, 0.5);
      border: 1px solid rgba(100, 150, 255, 0.5);
      z-index: 1000;
      transition: bottom 0.5s ease-in-out;
      overflow-y: auto;
      display: none;
    `;
    
    // content container 
    const content = document.createElement('div');
    content.id = 'planet-info-content';
    infoCard.appendChild(content);
    
    // Creating a Close Button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
    `;
    closeButton.onclick = () => this.hideInfoCard();
    infoCard.appendChild(closeButton);
    document.body.appendChild(infoCard);
    this.infoElement = infoCard;
  }
  
  updateInfoCard(planetName) {
    if (!this.planetInfo[planetName]) return;
    
    const info = this.planetInfo[planetName];
    const content = document.getElementById('planet-info-content');
    
    content.innerHTML = `
      <h2 style="color: #88ccff; margin-top: 0;">${info.title}</h2>
      <p style="line-height: 1.6;">${info.description}</p>
      <h3 style="color: #88ccff;">Main feature：</h3>
      <ul style="padding-left: 20px; line-height: 1.6;">
        ${info.facts.map(fact => `<li>${fact}</li>`).join('')}
      </ul>
    `;
    
    return true;
  }
  
  showInfoCard(planetName) {
    // If information about the same planet is already displayed, do nothing
    if (this.infoCardState.isOpen && this.infoCardState.currentPlanet === planetName) {
      return;
    }
    
    // Update card content
    const contentUpdated = this.updateInfoCard(planetName);
    if (!contentUpdated) return;
    
    // Clear the previous timer
    if (this.infoCardState.transitionTimer) {
      clearTimeout(this.infoCardState.transitionTimer);
    }
    
    // Show the card and set the state
    this.infoElement.style.display = 'block';
    this.infoCardState.currentPlanet = planetName;
    
    // Use setTimeout to ensure that the display changes before changing the position
    this.infoCardState.transitionTimer = setTimeout(() => {
      this.infoElement.style.bottom = '30px';
      this.infoCardState.isOpen = true;
    }, 10);
  }
  
  hideInfoCard() {
    if (!this.infoCardState.isOpen) return;
    
    // Hide Card
    this.infoElement.style.bottom = '-400px';
    
    // Clear the previous timer
    if (this.infoCardState.transitionTimer) {
      clearTimeout(this.infoCardState.transitionTimer);
    }
    
    // Set a timer and hide the element after the animation is complete
    this.infoCardState.transitionTimer = setTimeout(() => {
      this.infoElement.style.display = 'none';
      this.infoCardState.isOpen = false;
      this.infoCardState.currentPlanet = null;
    }, 500); // Matching CSS transition timings
  }
  
  setActiveCamera(camera) {
    this.activeCamera = camera;
  }
  
  // Check the distance between the spacecraft and the planet
  update() {
    if (!this.activeCamera) return;
    
    let closestPlanet = null;
    let closestDistance = Infinity;
    
    // Iterate over all planet groups and check the distance from the camera
    for (const planetName in this.planetGroups) {
      const planetGroup = this.planetGroups[planetName];
      
      // Calculate the distance from the camera to the planet
      const distance = planetGroup.position.distanceTo(this.activeCamera.position);
      
      // Update the nearest planet
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlanet = planetName;
      }
    }
    
    // Show or hide information based on distance
    if (closestDistance < this.proximityThreshold && closestPlanet) {
      this.showInfoCard(closestPlanet);
    } else if (this.infoCardState.isOpen && closestDistance > this.proximityThreshold * 1.5) {
      // If far from the planet, hide the information (add some buffer to prevent jitter at the border)
      this.hideInfoCard();
    }
  }
  
  dispose() {
    if (this.infoElement && this.infoElement.parentNode) {
      this.infoElement.parentNode.removeChild(this.infoElement);
    }
    if (this.infoCardState.transitionTimer) {
      clearTimeout(this.infoCardState.transitionTimer);
    }
  }
}

export { PlanetInfoSystem };