import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

declare const L: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  searchQuery = '';
  searchDate = '';
  userLocated = false;
  selectedMapCenter: any = null;
  private map: any;
  private markers: any[] = [];

  allMapCenters = [
    { id: '1', name: 'Orca Dive Club',      location: 'Sharm El Sheikh', rating: 4.9, price: 350, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80', lat: 27.9158, lng: 34.3300, distance: null as number | null },
    { id: '2', name: 'Blue Ocean Divers',   location: 'Hurghada',        rating: 4.8, price: 280, image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80', lat: 27.2574, lng: 33.8116, distance: null as number | null },
    { id: '3', name: 'Dahab Divers',        location: 'Dahab',           rating: 4.7, price: 220, image: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&q=80', lat: 28.4940, lng: 34.5138, distance: null as number | null },
    { id: '4', name: 'Red Sea Hub',         location: 'Marsa Alam',      rating: 4.9, price: 310, image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400&q=80', lat: 25.0677, lng: 34.8903, distance: null as number | null },
    { id: '5', name: 'Sharm Diving Center', location: 'Sharm El Sheikh', rating: 4.6, price: 300, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', lat: 27.8600, lng: 34.2800, distance: null as number | null },
    { id: '6', name: 'Blue Hole Divers',    location: 'Dahab',           rating: 4.8, price: 240, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', lat: 28.5710, lng: 34.5400, distance: null as number | null },
  ];

  mapCenters = [...this.allMapCenters];

  // باقي الـ data زي ما هي
  destinations = [
    { name: 'Sharm El Sheikh', desc: 'World-class reef diving', icon: 'waves', count: 48 },
    { name: 'Hurghada', desc: 'Gateway to the south', icon: 'anchor', count: 35 },
    { name: 'Dahab', desc: 'Bohemian shore dives', icon: 'beach_access', count: 22 },
    { name: 'Marsa Alam', desc: 'Dugongs & pristine reefs', icon: 'water', count: 19 },
  ];

  featuredCenters = [
    { id: '1', name: 'Orca Dive Club', location: 'Sharm El Sheikh', rating: 4.9, reviews: 312, price: 350, tags: ['PADI', 'Liveaboard'], image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80' },
    { id: '2', name: 'Blue Ocean Divers', location: 'Hurghada', rating: 4.8, reviews: 224, price: 280, tags: ['SSI', 'Day Trips'], image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80' },
    { id: '3', name: 'Dahab Divers', location: 'Dahab', rating: 4.7, reviews: 189, price: 220, tags: ['Free Dive', 'Courses'], image: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=600&q=80' },
    { id: '4', name: 'Red Sea Hub', location: 'Marsa Alam', rating: 4.9, reviews: 156, price: 310, tags: ['Liveaboard', 'PADI'], image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=600&q=80' },
  ];

  experiences = [
    { title: 'Liveaboard', desc: 'Multi-day expeditions to remote sites', icon: 'sailing' },
    { title: 'Day Trips', desc: 'Morning & afternoon reef dives', icon: 'wb_sunny' },
    { title: 'PADI Courses', desc: 'Open Water to Divemaster', icon: 'school' },
    { title: 'Freediving', desc: 'Explore depth without tanks', icon: 'self_improvement' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.about-block--anim').forEach(el => observer.observe(el));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 300);
  }

  private initMap(): void {
    this.map = L.map('aquabase-map', { zoomControl: false }).setView([27.0, 33.8], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 18
}).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.renderMarkers();
  }

  private renderMarkers(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const customIcon = (active = false) => L.divIcon({
      className: '',
      html: `<div style="
        width:${active ? 18 : 14}px; height:${active ? 18 : 14}px;
        background:${active ? '#01BFFC' : '#fff'};
        border:3px solid ${active ? '#fff' : '#002F7A'};
        border-radius:50%;
        box-shadow:0 2px 10px rgba(0,0,0,0.4);
        transition:all 0.2s;
      "></div>`,
      iconSize: [active ? 18 : 14, active ? 18 : 14],
      iconAnchor: [active ? 9 : 7, active ? 9 : 7],
    });

    this.mapCenters.forEach(c => {
      const marker = L.marker([c.lat, c.lng], { icon: customIcon(this.selectedMapCenter?.id === c.id) })
        .addTo(this.map)
        .on('click', () => this.selectMapCenter(c));
      this.markers.push(marker);
    });
  }

  selectMapCenter(c: any): void {
    this.selectedMapCenter = c;
    this.map.flyTo([c.lat, c.lng], 11, { duration: 1 });
    this.renderMarkers();
  }

  locateUser(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;

      // حساب المسافة لكل center
      this.mapCenters = this.allMapCenters
        .map(c => ({
          ...c,
          distance: Math.round(this.calcDist(lat, lng, c.lat, c.lng))
        }))
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

      this.userLocated = true;

      // أضف marker للـ user
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#01BFFC;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(1,191,252,0.25);"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      });
      L.marker([lat, lng], { icon: userIcon }).addTo(this.map).bindPopup('You are here');
      this.map.flyTo([lat, lng], 8, { duration: 1.5 });

      // اختار الأقرب تلقائياً
      this.selectMapCenter(this.mapCenters[0]);
    });
  }

  private calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  search() { this.router.navigate(['/home/centers'], { queryParams: { q: this.searchQuery } }); }
  goToCenter(id: string) { this.router.navigate(['/home/centers', id]); }
}