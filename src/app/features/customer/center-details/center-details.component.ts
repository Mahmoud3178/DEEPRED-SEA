import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-center-details', templateUrl: './center-details.component.html',
  styleUrls: ['./center-details.component.css'] })
export class CenterDetailsComponent implements OnInit {
  centerId = '';
  selectedTab = 'overview';

  center = {
    id: '1', name: 'Orca Dive Club', location: 'Sharm El Sheikh, South Sinai', rating: 4.9, reviews: 312,
    price: 350, tags: ['PADI', 'Liveaboard', 'SSI', 'Day Trips'],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    description: 'Orca Dive Club is one of Egypt\'s most prestigious diving centers, offering world-class experiences across Sharm El Sheikh\'s legendary reef systems. From the iconic Ras Mohammed National Park to the legendary Blue Hole, our certified instructors guide you through some of the world\'s most spectacular underwater environments.',
    verified: true,
    phone: '+20 100 123 4567',
    whatsapp: '201001234567',
    trips: [
      { id: 't1', name: 'Morning Reef Dive', duration: '3 hrs', depth: '18m', price: 350, type: 'Day Trip', available: 8 },
      { id: 't2', name: 'Ras Mohammed National Park', duration: '6 hrs', depth: '30m', price: 650, type: 'Day Trip', available: 6 },
      { id: 't3', name: 'Thistlegorm Wreck', duration: '8 hrs', depth: '32m', price: 850, type: 'Liveaboard', available: 4 },
      { id: 't4', name: 'PADI Open Water Course', duration: '4 days', depth: '18m', price: 2800, type: 'Course', available: 12 },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
      'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&q=80',
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    ],
    reviewsList: [
  { name: 'Sarah M.', rating: 5, date: 'Dec 2024', text: 'Absolutely incredible experience! The instructors were professional and the sites were breathtaking.', reply: 'Thank you Sarah! It was a pleasure diving with you. Hope to see you again soon! 🤿' },
  { name: 'James K.', rating: 5, date: 'Nov 2024', text: 'Best dive center in Sharm by far. The Thistlegorm wreck trip was the highlight of my trip.', reply: 'Thanks James! The Thistlegorm is always special. You\'re welcome back anytime!' },
  { name: 'Lena P.', rating: 4, date: 'Oct 2024', text: 'Great organization, beautiful sites. Would highly recommend to beginners and experienced divers alike.', reply: '' },
]
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() { this.centerId = this.route.snapshot.params['id'] || '1'; }

  bookTrip(tripId: string) {
    this.router.navigate(['/home/booking', this.centerId], { queryParams: { trip: tripId } });
  }

  openWhatsApp() {
    window.open(`https://wa.me/${this.center.whatsapp}?text=Hi, I'm interested in booking a dive!`, '_blank');
  }
}
