export type UserRole = 'customer' | 'center' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  user?: User;  // optional لأن ممكن الباك إند ميبعتوش
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterCenterPayload {
  centerName: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  governorate: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  facebookPage: string;
  website: string;
  instagramPage: string;
}
