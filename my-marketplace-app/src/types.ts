// src/types.ts

export interface ListingImage {
    id: string; // Assuming UUID is string
    url: string;
    display_order?: number;
}

export interface Listing {
    id: string; // Assuming UUID is string
    title: string;
    description?: string;
    price: number;
    currency?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    owner_id?: string;
    category_id?: number;
    images?: ListingImage[];
    main_image_url?: string | null;
    seller?: { // Assuming basic seller info might be needed
        id: string;
        full_name?: string;
        telegram_username?: string;
    };
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface UserPublic {
    id: string; // Assuming UUID is string
    full_name?: string | null;
    avatar_url?: string | null;
}

interface Prices {
    USD: number;
    RUB: number;
    THB: number;
}

// This type should match schemas.ListingPublic from the backend
export interface ListingPublic {
    id: string; // Assuming UUID is string
    title: string;
    description?: string | null;
    prices: Prices;
    created_at: string; // Typically ISO string date
    main_image_url?: string | null;
    seller: UserPublic;
    category?: Category | null;
}
