import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-centers', templateUrl: './centers.component.html',
  styleUrls: ['./centers.component.css'] })
export class CentersComponent implements OnInit {
  searchQuery = '';
  selectedLocation = 'All';
  selectedType = 'All';
  sortBy = 'rating';

  locations = ['All', 'Sharm El Sheikh', 'Hurghada', 'Dahab', 'Marsa Alam'];
  types = ['All', 'PADI', 'SSI', 'Liveaboard', 'Day Trips', 'Freediving', 'Courses'];

  allCenters = [
    { id: '1', name: 'Orca Dive Club', location: 'Sharm El Sheikh', rating: 4.9, reviews: 312, price: 350, tags: ['PADI', 'Liveaboard'], image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', verified: true },
    { id: '2', name: 'Blue Ocean Divers', location: 'Hurghada', rating: 4.8, reviews: 224, price: 280, tags: ['SSI', 'Day Trips'], image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80', verified: true },
    { id: '3', name: 'Dahab Divers', location: 'Dahab', rating: 4.7, reviews: 189, price: 220, tags: ['Freediving', 'Courses'], image: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=600&q=80', verified: false },
    { id: '4', name: 'Red Sea Hub', location: 'Marsa Alam', rating: 4.9, reviews: 156, price: 310, tags: ['Liveaboard', 'PADI'], image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=600&q=80', verified: true },
    { id: '5', name: 'Sharm Diving Center', location: 'Sharm El Sheikh', rating: 4.6, reviews: 98, price: 300, tags: ['PADI', 'Day Trips'], image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', verified: true },
    { id: '6', name: 'Hurghada Sea Stars', location: 'Hurghada', rating: 4.5, reviews: 143, price: 260, tags: ['SSI', 'Courses'], image: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=600&q=80', verified: false },
    { id: '7', name: 'Blue Hole Divers', location: 'Dahab', rating: 4.8, reviews: 207, price: 240, tags: ['Freediving', 'PADI'], image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', verified: true },
    { id: '8', name: 'Marsa Dream Diving', location: 'Marsa Alam', rating: 4.7, reviews: 88, price: 295, tags: ['Liveaboard', 'Day Trips'], image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80', verified: true },
  ];

  get filteredCenters() {
    return this.allCenters
      .filter(c => {
        const matchQ = !this.searchQuery || c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || c.location.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchL = !this.selectedLocation || this.selectedLocation === 'All' || c.location === this.selectedLocation;
        const matchT = !this.selectedType || this.selectedType === 'All' || c.tags.includes(this.selectedType);
        return matchQ && matchL && matchT;
      })
      .sort((a, b) => this.sortBy === 'price' ? a.price - b.price : b.rating - a.rating);
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => { if (p['q']) this.searchQuery = p['q']; });

    const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.about-block--anim').forEach(el => {
    observer.observe(el);
  });
  }

  goToCenter(id: string) { this.router.navigate(['/home/centers', id]); }

  
}
