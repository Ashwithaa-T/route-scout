import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, Compass, ArrowRight, ArrowLeft, Loader2,
  Check, CloudRain, Sun, AlertTriangle, Sparkles, Clock,
  Share2, Printer, Info, Star, Wind, Droplets
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Curated destination data with images and descriptions
const CURATED_CITIES = {
  'Bengaluru': {
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80',
    desc: 'The garden city of India — serene parks, vibrant culinary gems, and a thriving cultural pulse.',
    tagline: 'The Garden City'
  },
  'Jaipur': {
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80',
    desc: 'The legendary Pink City — majestic forts, royal palaces, and warm desert hospitality.',
    tagline: 'The Pink City'
  },
  'Hyderabad': {
    image: 'https://images.unsplash.com/photo-1657981630164-769503f3a9a8?auto=format&fit=crop&q=80',
    desc: 'City of Pearls — where Nizami grandeur meets a cosmopolitan modern lifestyle.',
    tagline: 'City of Pearls'
  },
  'Chennai': {
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80',
    desc: 'Gateway to the South — ancient temples, stunning Marina beach, and vibrant classical arts.',
    tagline: 'Gateway to the South'
  },
  'Mumbai': {
    image: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&q=80',
    desc: 'The City of Dreams — iconic colonial landmarks, sparkling Marine Drive, and legendary street food.',
    tagline: 'City of Dreams'
  },
  'Paris': {
    image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&q=80',
    desc: 'The City of Light — world-class art, iconic architecture, and timeless culinary romance.',
    tagline: 'City of Light'
  },
  'Tokyo': {
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80',
    desc: 'Where ancient tradition meets dazzling modernity — shrines, neon, and refined culinary craft.',
    tagline: 'The Neon Metropolis'
  },
  'Singapore': {
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80',
    desc: 'The pristine city-state — futuristic gardens, multicultural dining, and impeccable luxury.',
    tagline: 'The Lion City'
  },
  'London': {
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80',
    desc: 'A grand metropolis of royal history, world-leading museums, and iconic riverside grandeur.',
    tagline: 'The Royal Capital'
  },
  'San Diego': {
    image: 'https://images.unsplash.com/photo-1729010111877-8548923fa468?auto=format&fit=crop&q=80',
    desc: 'Stunning Southern California coast — golden beaches, scenic parks, and sun-drenched bay culture.',
    tagline: 'The Sun-Kissed Bay'
  }
};

// Static curated day-by-day schedules (Morning / Afternoon / Evening) for each city
const CITY_SCHEDULES = {
  'Jaipur': [
    {
      Morning: { name: 'Amer Fort & Elephant Trail', type: 'Forts & Palaces', icon: '🏰' },
      Afternoon: { name: 'Hawa Mahal Photo Walk', type: 'Landmark', icon: '🌅' },
      Evening: { name: 'Chokhi Dhani Cultural Dinner', type: 'Fine Dining', icon: '🍽️' }
    },
    {
      Morning: { name: 'City Palace Complex Tour', type: 'Forts & Palaces', icon: '🏯' },
      Afternoon: { name: 'Jantar Mantar UNESCO Observatory', type: 'Heritage', icon: '🔭' },
      Evening: { name: 'Johari Bazaar & Gemstone Walk', type: 'Shopping', icon: '💎' }
    },
    {
      Morning: { name: 'Nahargarh Fort Sunrise Hike', type: 'Nature & Trek', icon: '🌄' },
      Afternoon: { name: 'Albert Hall Museum', type: 'Museum', icon: '🏛️' },
      Evening: { name: 'Jal Mahal Lake Promenade', type: 'Scenic', icon: '🌙' }
    },
    {
      Morning: { name: 'Jaigarh Fort & Cannon Walk', type: 'Heritage', icon: '🏰' },
      Afternoon: { name: 'Galta Ji Monkey Temple Visit', type: 'Spiritual', icon: '🛕' },
      Evening: { name: 'Rajasthani Thali Feast', type: 'Culinary', icon: '🍛' }
    },
    {
      Morning: { name: 'Sisodia Rani Gardens Stroll', type: 'Gardens', icon: '🌸' },
      Afternoon: { name: 'Amrapali Museum of Jewels', type: 'Museum', icon: '💍' },
      Evening: { name: 'Folk Dance & Puppet Show', type: 'Cultural', icon: '🎭' }
    },
    {
      Morning: { name: 'Patrika Gate Sunrise Shoot', type: 'Photography', icon: '📸' },
      Afternoon: { name: 'Birla Mandir Temple Visit', type: 'Spiritual', icon: '🕌' },
      Evening: { name: 'Masala Chowk Street Food Tour', type: 'Street Food', icon: '🌮' }
    },
    {
      Morning: { name: 'Chand Baori Stepwell Excursion', type: 'Heritage', icon: '🪜' },
      Afternoon: { name: 'Anokhi Museum of Hand Printing', type: 'Art', icon: '🎨' },
      Evening: { name: 'Padao Rooftop Sunset Dining', type: 'Fine Dining', icon: '🌇' }
    }
  ],
  'Bengaluru': [
    {
      Morning: { name: 'Cubbon Park Morning Stroll', type: 'Parks & Gardens', icon: '🌿' },
      Afternoon: { name: 'Visvesvaraya Technology Museum', type: 'Museum', icon: '⚙️' },
      Evening: { name: 'UB City Rooftop Dining', type: 'Fine Dining', icon: '🍷' }
    },
    {
      Morning: { name: 'Bangalore Palace Royal Tour', type: 'Heritage', icon: '🏰' },
      Afternoon: { name: 'National Gallery of Modern Art', type: 'Art Gallery', icon: '🎨' },
      Evening: { name: 'Indiranagar Brewery Experience', type: 'Craft Beer', icon: '🍺' }
    },
    {
      Morning: { name: 'Lalbagh Botanical Garden Walk', type: 'Nature', icon: '🌺' },
      Afternoon: { name: 'Commercial Street Shopping', type: 'Shopping', icon: '🛍️' },
      Evening: { name: 'Vidhana Soudha Light Show', type: 'Landmark', icon: '✨' }
    },
    {
      Morning: { name: "Tipu Sultan's Summer Palace", type: 'Heritage', icon: '🕌' },
      Afternoon: { name: 'Nandi Hills Scenic Drive', type: 'Nature & Trek', icon: '⛰️' },
      Evening: { name: 'Traditional MTR Feast', type: 'Culinary', icon: '🍛' }
    },
    {
      Morning: { name: 'Bannerghatta National Park Safari', type: 'Wildlife', icon: '🦁' },
      Afternoon: { name: 'HAL Aerospace Museum', type: 'Museum', icon: '✈️' },
      Evening: { name: 'Koramangala Rooftop Dinner', type: 'Fine Dining', icon: '🌙' }
    },
    {
      Morning: { name: 'ISKCON Temple Morning Prayers', type: 'Spiritual', icon: '🛕' },
      Afternoon: { name: 'Chitrakala Parishath Galleries', type: 'Art', icon: '🖼️' },
      Evening: { name: 'VV Puram Food Street Tour', type: 'Street Food', icon: '🌮' }
    },
    {
      Morning: { name: 'Bull Temple & Bugle Rock', type: 'Spiritual', icon: '🐂' },
      Afternoon: { name: 'Innovative Film City Excursion', type: 'Entertainment', icon: '🎬' },
      Evening: { name: 'Craft Beer & Farewell Dinner', type: 'Dining', icon: '🍻' }
    }
  ],
  'Hyderabad': [
    {
      Morning: { name: 'Golconda Fort Acoustic Tour', type: 'Forts & Heritage', icon: '🏰' },
      Afternoon: { name: 'Qutb Shahi Tombs Visit', type: 'Heritage', icon: '🕌' },
      Evening: { name: 'Hussain Sagar Lake Cruise', type: 'Scenic', icon: '⛵' }
    },
    {
      Morning: { name: 'Salar Jung Museum Walk', type: 'World-Class Museum', icon: '🏛️' },
      Afternoon: { name: 'Chowmahalla Palace Tour', type: 'Palace', icon: '🏯' },
      Evening: { name: 'Charminar & Laad Bazaar', type: 'Shopping & Landmark', icon: '💍' }
    },
    {
      Morning: { name: 'Ramoji Film City Day Tour', type: 'Entertainment', icon: '🎬' },
      Afternoon: { name: 'Studio Set Exploration', type: 'Cinematic Experience', icon: '📽️' },
      Evening: { name: 'Iconic Biryani at Paradise', type: 'Culinary Heritage', icon: '🍛' }
    },
    {
      Morning: { name: 'Birla Science Museum', type: 'Science & Tech', icon: '🔬' },
      Afternoon: { name: 'NTR Gardens Lakeside Stroll', type: 'Parks', icon: '🌳' },
      Evening: { name: 'Hyderabadi Dinner Banquet', type: 'Fine Dining', icon: '🥘' }
    },
    {
      Morning: { name: 'Nehru Zoological Park Safari', type: 'Wildlife', icon: '🦒' },
      Afternoon: { name: 'Sudha Car Museum', type: 'Unique Museum', icon: '🚗' },
      Evening: { name: 'Durgam Cheruvu Lake Walk', type: 'Scenic', icon: '🌅' }
    },
    {
      Morning: { name: 'Shilparamam Arts Village', type: 'Crafts & Culture', icon: '🎨' },
      Afternoon: { name: 'Inorbit Mall Leisure', type: 'Shopping', icon: '🛍️' },
      Evening: { name: 'Local Cuisine Street Tour', type: 'Street Food', icon: '🌮' }
    },
    {
      Morning: { name: 'Paigah Tombs Heritage Visit', type: 'Spiritual Heritage', icon: '🕌' },
      Afternoon: { name: 'State Gallery of Art', type: 'Art', icon: '🖼️' },
      Evening: { name: 'Sunset Dinner Cruise', type: 'Fine Dining', icon: '🌇' }
    }
  ],
  'Chennai': [
    {
      Morning: { name: 'Kapaleeshwarar Temple', type: 'Spiritual', icon: '🛕' },
      Afternoon: { name: 'Government Museum Tour', type: 'Museum', icon: '🏛️' },
      Evening: { name: 'Marina Beach Sunset Walk', type: 'Scenic', icon: '🌊' }
    },
    {
      Morning: { name: 'Santhome Cathedral Basilica', type: 'Heritage', icon: '⛪' },
      Afternoon: { name: 'Fort St. George Museum', type: 'Colonial Heritage', icon: '🏰' },
      Evening: { name: 'Filter Coffee & Mylapore Dining', type: 'Culinary', icon: '☕' }
    },
    {
      Morning: { name: 'DakshinaChitra Heritage Museum', type: 'Living Heritage', icon: '🎭' },
      Afternoon: { name: 'Mahabalipuram Shore Temple', type: 'UNESCO Heritage', icon: '🌊' },
      Evening: { name: 'Chettinad Dinner Experience', type: 'Fine Dining', icon: '🍛' }
    },
    {
      Morning: { name: 'Guindy National Park Stroll', type: 'Wildlife & Nature', icon: '🦌' },
      Afternoon: { name: 'Birla Planetarium Show', type: 'Science', icon: '🌌' },
      Evening: { name: 'T. Nagar Shopping Spree', type: 'Shopping', icon: '🛍️' }
    },
    {
      Morning: { name: 'Cholamandal Artists Village', type: 'Art Colony', icon: '🎨' },
      Afternoon: { name: 'VGP Universal Kingdom Park', type: 'Entertainment', icon: '🎡' },
      Evening: { name: 'Seafood Fine Dining on ECR', type: 'Culinary', icon: '🦞' }
    },
    {
      Morning: { name: 'Kalakshetra Foundation Tour', type: 'Classical Arts', icon: '💃' },
      Afternoon: { name: 'Semmozhi Poonga Gardens', type: 'Botanical Gardens', icon: '🌺' },
      Evening: { name: 'Besant Nagar Beach Evening', type: 'Coastal', icon: '🌙' }
    },
    {
      Morning: { name: 'Pulicat Lake Bird Watching', type: 'Nature & Wildlife', icon: '🦢' },
      Afternoon: { name: 'Express Avenue Leisure', type: 'Lifestyle', icon: '☕' },
      Evening: { name: 'Grand Farewell Seafood Dinner', type: 'Fine Dining', icon: '🍾' }
    }
  ],
  'Mumbai': [
    {
      Morning: { name: 'Gateway of India & Taj Mahal Palace', type: 'Iconic Landmark', icon: '🏛️' },
      Afternoon: { name: 'Chhatrapati Shivaji Maharaj Museum', type: 'World-Class Museum', icon: '🏛️' },
      Evening: { name: 'Marine Drive Sunset Stroll', type: 'Scenic', icon: '🌊' }
    },
    {
      Morning: { name: 'Elephanta Caves Ferry & Tour', type: 'UNESCO Heritage', icon: '⛵' },
      Afternoon: { name: 'Colaba Causeway Shopping', type: 'Shopping', icon: '🛍️' },
      Evening: { name: 'Seafood at Mahesh Lunch Home', type: 'Culinary Heritage', icon: '🦞' }
    },
    {
      Morning: { name: 'Haji Ali Dargah Visit', type: 'Spiritual Landmark', icon: '🕌' },
      Afternoon: { name: 'Nehru Science Centre', type: 'Science & Innovation', icon: '🔬' },
      Evening: { name: 'Bandra Bandstand & Sea Link View', type: 'Scenic', icon: '🌉' }
    },
    {
      Morning: { name: 'Sanjay Gandhi National Park', type: 'Nature & Wildlife', icon: '🐆' },
      Afternoon: { name: 'Kanheri Caves Exploration', type: 'Ancient Heritage', icon: '🗿' },
      Evening: { name: 'Juhu Beach Street Food Experience', type: 'Street Food', icon: '🌮' }
    },
    {
      Morning: { name: 'Dhobi Ghat Photography Walk', type: 'Cultural Experience', icon: '📸' },
      Afternoon: { name: 'Crawford Market Discovery', type: 'Markets', icon: '🧺' },
      Evening: { name: 'Parsi Dinner at Britannia & Co.', type: 'Heritage Dining', icon: '🍽️' }
    },
    {
      Morning: { name: 'Worli Fort Coastal Walk', type: 'Coastal Heritage', icon: '🏰' },
      Afternoon: { name: 'NGMA Mumbai Art Galleries', type: 'Art', icon: '🖼️' },
      Evening: { name: 'Lower Parel Fine Dining Lounge', type: 'Fine Dining', icon: '🍷' }
    },
    {
      Morning: { name: 'Global Vipassana Pagoda', type: 'Spiritual', icon: '🛕' },
      Afternoon: { name: 'Phoenix Palladium Luxury Mall', type: 'Lifestyle & Shopping', icon: '🏷️' },
      Evening: { name: 'High Tea at The Oberoi', type: 'Luxury Experience', icon: '🫖' }
    }
  ],
  'Paris': [
    {
      Morning: { name: 'Eiffel Tower Summit Climb', type: 'Iconic Landmark', icon: '🗼' },
      Afternoon: { name: 'Champ de Mars Garden Picnic', type: 'Relaxation', icon: '🥖' },
      Evening: { name: 'Seine River Dinner Cruise', type: 'Culinary', icon: '🚢' }
    },
    {
      Morning: { name: 'Louvre Museum Guided Tour', type: 'Art & History', icon: '🖼️' },
      Afternoon: { name: 'Tuileries Garden Terrace Walk', type: 'Nature', icon: '🌳' },
      Evening: { name: 'Montmartre Bistro Dining', type: 'Local Culture', icon: '🍷' }
    },
    {
      Morning: { name: 'Versailles Palace Excursion', type: 'Royal Heritage', icon: '🏰' },
      Afternoon: { name: 'Palace Fountains & Gardens Stroll', type: 'Scenic', icon: '⛲' },
      Evening: { name: 'Latin Quarter Street Food Tour', type: 'Culinary', icon: '🧆' }
    },
    {
      Morning: { name: 'Musée d’Orsay Impressionist Art', type: 'Art Gallery', icon: '🎨' },
      Afternoon: { name: 'Saint-Germain-des-Prés Cafés', type: 'Relaxation', icon: '☕' },
      Evening: { name: 'Le Marais Boutique Promenade', type: 'Shopping', icon: '🛍️' }
    },
    {
      Morning: { name: 'Sainte-Chapelle Stained Glass View', type: 'Heritage', icon: '⛪' },
      Afternoon: { name: 'Île de la Cité & Notre-Dame Area', type: 'History', icon: '🗺️' },
      Evening: { name: 'Montparnasse Tower Sunset Lounge', type: 'Scenic Views', icon: '🌇' }
    },
    {
      Morning: { name: 'Arc de Triomphe Rooftop View', type: 'Monuments', icon: '🧱' },
      Afternoon: { name: 'Champs-Élysées Luxury Shopping', type: 'Shopping', icon: '🛒' },
      Evening: { name: 'Classic French Fine Dining', type: 'Fine Dining', icon: '🍽️' }
    },
    {
      Morning: { name: 'Sacré-Cœur Basilica Morning Stroll', type: 'Spiritual', icon: '🕌' },
      Afternoon: { name: 'Canal Saint-Martin Leisure Walk', type: 'Relaxation', icon: '💧' },
      Evening: { name: 'Opera District Farewell Dinner', type: 'Culinary', icon: '🥩' }
    }
  ],
  'Tokyo': [
    {
      Morning: { name: 'Senso-ji Temple Asakusa Walk', type: 'Heritage', icon: '🏮' },
      Afternoon: { name: 'Akihabara Electric Town Explore', type: 'Tech & Gaming', icon: '🎮' },
      Evening: { name: 'Shibuya Crossing & Izakaya Dinner', type: 'Local Culture', icon: '🍻' }
    },
    {
      Morning: { name: 'Meiji Shrine Forest Stroll', type: 'Spiritual', icon: '⛩️' },
      Afternoon: { name: 'Harajuku Takeshita Street Fashion', type: 'Trend Hunting', icon: '🛍️' },
      Evening: { name: 'Shinjuku Omoide Yokocho Dining', type: 'Culinary', icon: '🍢' }
    },
    {
      Morning: { name: 'Tsukiji Outer Fish Market Tasting', type: 'Culinary', icon: '🍣' },
      Afternoon: { name: 'TeamLab Planets Digital Art', type: 'Modern Art', icon: '✨' },
      Evening: { name: 'Odaiba Seaside Park Sunset', type: 'Scenic Views', icon: '🗽' }
    },
    {
      Morning: { name: 'Imperial Palace East Gardens', type: 'History', icon: '🏯' },
      Afternoon: { name: 'Ginza District Gallery Walk', type: 'Luxury Shopping', icon: '👜' },
      Evening: { name: 'Roppongi Hills Sky Deck Views', type: 'Scenic', icon: '🌃' }
    },
    {
      Morning: { name: 'Ueno Park & National Museum', type: 'Culture', icon: '🏛️' },
      Afternoon: { name: 'Ameyoko Market Street Shopping', type: 'Street Market', icon: '🛒' },
      Evening: { name: 'Yanesen Old Tokyo Neighborhood Walk', type: 'Relaxation', icon: '🍡' }
    },
    {
      Morning: { name: 'Ghibli Museum Magical Tour', type: 'Animation Culture', icon: '🌳' },
      Afternoon: { name: 'Inokashira Park Swan Boat Ride', type: 'Nature', icon: '🦆' },
      Evening: { name: 'Kichijoji Food Alley Tour', type: 'Culinary', icon: '🍜' }
    },
    {
      Morning: { name: 'Tokyo Skytree Panoramic View', type: 'Iconic Landmark', icon: '🗼' },
      Afternoon: { name: 'Sumida River Cruise Ride', type: 'Scenic', icon: '🚢' },
      Evening: { name: 'Premium Kaiseki Multi-Course Feast', type: 'Fine Dining', icon: '🍱' }
    }
  ],

  'Singapore': [
    {
      Morning: { name: 'Gardens by the Bay Cloud Forest', type: 'Nature Dome', icon: '🌴' },
      Afternoon: { name: 'Marina Bay Sands SkyPark Lounge', type: 'Scenic Views', icon: '🏙️' },
      Evening: { name: 'Clarke Quay Waterfront Seafood', type: 'Culinary', icon: '🦀' }
    },
    {
      Morning: { name: 'Sentosa Island Cable Car Ride', type: 'Adventure', icon: '🚡' },
      Afternoon: { name: 'Universal Studios Theme Park', type: 'Entertainment', icon: '🎢' },
      Evening: { name: 'Siloso Beach Side Sunset Grill', type: 'Relaxation', icon: '🏖️' }
    },
    {
      Morning: { name: 'Singapore Botanic Gardens Walk', type: 'UNESCO Nature', icon: '🌺' },
      Afternoon: { name: 'Orchard Road Retail Exploration', type: 'Shopping', icon: '🛍️' },
      Evening: { name: 'Lau Pa Sat Hawker Center Dinner', type: 'Local Culture', icon: '🍢' }
    },
    {
      Morning: { name: 'Chinatown Heritage Center Tour', type: 'History', icon: '🛕' },
      Afternoon: { name: 'Little India Colorful Street Walk', type: 'Culture', icon: '🕌' },
      Evening: { name: 'Kampong Glam & Haji Lane Cafes', type: 'Boutique Trend', icon: '☕' }
    },
    {
      Morning: { name: 'Singapore Zoo Rainforest Safari', type: 'Wildlife', icon: '🐒' },
      Afternoon: { name: 'River Wonders Aquarium Cruise', type: 'Nature', icon: '🐼' },
      Evening: { name: 'Night Safari Tram Journey', type: 'Adventure', icon: '🌙' }
    },
    {
      Morning: { name: 'National Gallery Singapore Tour', type: 'Art Culture', icon: '🏛️' },
      Afternoon: { name: 'Civic District Historic Walk', type: 'History', icon: '🗺️' },
      Evening: { name: 'Changi Jewel Rain Vortex Canopy', type: 'Iconic Landmark', icon: '⛲' }
    },
    {
      Morning: { name: 'Southern Ridges Canopy Walk', type: 'Nature Trek', icon: '🥾' },
      Afternoon: { name: 'VivoCity Shopping & Coastal Views', type: 'Shopping', icon: '🛒' },
      Evening: { name: 'Marina Bay Light & Water Show', type: 'Entertainment', icon: '🎆' }
    }
  ],
  'London': [
    {
      Morning: { name: 'Tower of London & Crown Jewels', type: 'Royal History', icon: '🏰' },
      Afternoon: { name: 'Tower Bridge Skywalk & River Walk', type: 'Iconic Landmark', icon: '🌉' },
      Evening: { name: 'Borough Market Artisanal Dinner', type: 'Culinary', icon: '🍽️' }
    },
    {
      Morning: { name: 'Westminster Abbey Guided Tour', type: 'Heritage', icon: '⛪' },
      Afternoon: { name: 'Big Ben & St. James’s Park Stroll', type: 'Scenic Walk', icon: '🌳' },
      Evening: { name: 'Soho Classic Theatre & West End Show', type: 'Entertainment', icon: '🎭' }
    },
    {
      Morning: { name: 'British Museum Cultural Artifacts', type: 'History & Art', icon: '🏛️' },
      Afternoon: { name: 'Covent Garden Street Performers', type: 'Shopping', icon: '🛍️' },
      Evening: { name: 'Traditional British Pub Feast', type: 'Local Culture', icon: '🍺' }
    },
    {
      Morning: { name: 'Buckingham Palace Changing of Guard', type: 'Royal Tradition', icon: '💂' },
      Afternoon: { name: 'Hyde Park Boating & Serpentine Walk', type: 'Nature', icon: '🦆' },
      Evening: { name: 'Mayfair Premium Fine Dining', type: 'Fine Dining', icon: '🥩' }
    },
    {
      Morning: { name: 'London Eye Panoramic Flight', type: 'Scenic Views', icon: '🎡' },
      Afternoon: { name: 'South Bank Arts Centre Stroll', type: 'Culture', icon: '🎨' },
      Evening: { name: 'Thames River Sunset Cruise & Drinks', type: 'Premium', icon: '🚢' }
    },
    {
      Morning: { name: 'Natural History Museum Central Hall', type: 'Science', icon: '🦕' },
      Afternoon: { name: 'Kensington Palace & Gardens Visit', type: 'Royal Heritage', icon: '🌸' },
      Evening: { name: 'Notting Hill Pastel Street Wandering', type: 'Neighbourhood', icon: '🏡' }
    },
    {
      Morning: { name: 'Greenwich Observatory Prime Meridian', type: 'Science & Views', icon: '🌍' },
      Afternoon: { name: 'National Gallery Trafalgar Square', type: 'Fine Art', icon: '🖼️' },
      Evening: { name: 'Shard Rooftop Farewell Dinner', type: 'Scenic Views', icon: '🌃' }
    }
  ],
  'San Diego': [
    {
      Morning: { name: 'Balboa Park & San Diego Zoo', type: 'Nature & Wildlife', icon: '🦁' },
      Afternoon: { name: 'Old Town San Diego Stroll', type: 'Colonial Heritage', icon: '🎪' },
      Evening: { name: 'Gaslamp Quarter Dinner', type: 'Culinary', icon: '🍻' }
    },
    {
      Morning: { name: 'La Jolla Cove Snorkelling', type: 'Coastal Adventure', icon: '🤿' },
      Afternoon: { name: 'Torrey Pines State Reserve Hike', type: 'Nature Trek', icon: '🌲' },
      Evening: { name: 'Pacific Beach Sunset Walk', type: 'Coastal Scenic', icon: '🌅' }
    },
    {
      Morning: { name: 'USS Midway Aircraft Carrier Museum', type: 'Naval Heritage', icon: '⚓' },
      Afternoon: { name: 'Little Italy Neighbourhood Wander', type: 'Neighbourhood', icon: '🍕' },
      Evening: { name: 'Craft Beer Tour', type: 'Local Culture', icon: '🍺' }
    },
    {
      Morning: { name: 'Coronado Island Bike Ride', type: 'Coastal Scenic', icon: '🚴' },
      Afternoon: { name: 'Seaport Village Waterfront Lunch', type: 'Relaxation', icon: '🛍️' },
      Evening: { name: 'Ocean Beach Pier Sunset Dinner', type: 'Culinary', icon: '🌊' }
    },
    {
      Morning: { name: 'Cabrilho National Monument Tour', type: 'History & Views', icon: '🗿' },
      Afternoon: { name: 'Liberty Station Public Market', type: 'Food Hall', icon: '🍔' },
      Evening: { name: 'Sunset Cliffs Marine Promenade', type: 'Scenic', icon: '🌇' }
    },
    {
      Morning: { name: 'San Diego Botanic Garden Stroll', type: 'Botanical', icon: '🌸' },
      Afternoon: { name: 'Museum of Contemporary Art Visit', type: 'Art Culture', icon: '🖼️' },
      Evening: { name: 'Harbor Cruise & Local Cider Tasting', type: 'Premium Experience', icon: '🚢' }
    },
    {
      Morning: { name: 'Mission Bay Watersports Session', type: 'Adventure', icon: '🏄' },
      Afternoon: { name: 'Del Mar Coastline Leisure Walk', type: 'Beach Stroll', icon: '🏖️' },
      Evening: { name: 'Resort Beachside Bonfire Night', type: 'Social Lounge', icon: '🔥' }
    }
  ],
};

// Fallback schedule for unknown cities
const DEFAULT_SCHEDULE = [
  {
    Morning: { name: 'Morning City Walking Tour', type: 'Exploration', icon: '🚶' },
    Afternoon: { name: 'Local Market Visit', type: 'Culinary Discovery', icon: '🧺' },
    Evening: { name: 'Historical Museum Evening', type: 'Culture', icon: '🏛️' }
  },
  {
    Morning: { name: 'Scenic Viewpoint & Photography', type: 'Nature & Views', icon: '📸' },
    Afternoon: { name: 'Immersive Cooking Class', type: 'Culinary', icon: '👨‍🍳' },
    Evening: { name: 'Evening Cultural Performance', type: 'Arts', icon: '🎭' }
  },
  {
    Morning: { name: 'Countryside Day Excursion', type: 'Nature', icon: '🌄' },
    Afternoon: { name: 'Artisan Craft Workshop', type: 'Local Culture', icon: '🎨' },
    Evening: { name: 'Fine Dining Farewell Feast', type: 'Culinary', icon: '🍾' }
  }
];


function getTypeColor(type) {
  const t = type.toLowerCase();
  if (t.includes('fort') || t.includes('palace') || t.includes('heritage') || t.includes('royal')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (t.includes('museum') || t.includes('art') || t.includes('gallery')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (t.includes('food') || t.includes('dining') || t.includes('culinary') || t.includes('feast') || t.includes('dinner')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (t.includes('nature') || t.includes('park') || t.includes('garden') || t.includes('wildlife')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (t.includes('scenic') || t.includes('coastal') || t.includes('beach') || t.includes('lake')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (t.includes('spiritual') || t.includes('temple') || t.includes('sacred')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function App() {
  const [view, setView] = useState(1);
  const [destination, setDestination] = useState('Jaipur');
  const [customCity, setCustomCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().split('T')[0];
  });


  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStep, setGenerateStep] = useState(0);
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [toastMessage, setToastMessage] = useState('');

  const LOADING_STEPS = [
    { label: 'Building your personalised timeline…', icon: '🗺️' },
    { label: 'Checking live weather conditions…', icon: '🌤️' },
    { label: 'Optimising activities for your preferences…', icon: '✨' },
    { label: 'Polishing your perfect itinerary…', icon: '🎯' },
  ];

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => { if (res.ok) setApiConnected(true); })
      .catch(() => setApiConnected(false));
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const getTripDuration = () => {
    if (!startDate || !endDate) return 0;
    const diff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : diff;
  };

  const durationDays = getTripDuration();
  const isDurationValid = durationDays >= 1 && durationDays <= 7;

  const handleCitySelect = (val) => {
    if (val === 'CUSTOM') { setIsCustomCity(true); setDestination(''); }
    else { setIsCustomCity(false); setDestination(val); }
  };

  const handleGenerate = async () => {
    if (!isDurationValid) { triggerToast('Please select dates for a 1–7 day journey.'); return; }
    const finalDest = isCustomCity ? customCity.trim() : destination;
    if (!finalDest) { triggerToast('Please choose a destination to continue.'); return; }

    setIsGenerating(true);
    setGenerateStep(0);
    setApiError(null);

    const stepTimer = setInterval(() => {
      setGenerateStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 750);

    try {
      const response = await fetch(`${API_BASE}/api/plan-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: finalDest, start_date: startDate, end_date: endDate })
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      clearInterval(stepTimer);
      setGenerateStep(3);
      setTimeout(() => {
        setApiResult(data);
        setIsGenerating(false);
        setActiveDayTab(1);
        setView(2);
      }, 400);
    } catch (err) {
      clearInterval(stepTimer);
      // Fall back gracefully: use static schedule data
      setApiResult(null);
      setIsGenerating(false);
      setActiveDayTab(1);
      setView(2);
    }
  };

  const handleBack = () => { setView(1); setApiResult(null); setApiError(null); };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => triggerToast('✓ Trip plan link copied to clipboard!'))
      .catch(() => triggerToast('Could not copy link.'));
  };
  const handlePrint = () => window.print();

  const activeCityKey = isCustomCity ? customCity.trim() : destination;
  const matchedCity = CURATED_CITIES[activeCityKey];
  const bgImage = matchedCity
    ? matchedCity.image
    : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80';

  // Get schedule: from API or from static data
  const getScheduleForDay = (dayNum) => {
    const staticSchedule = CITY_SCHEDULES[activeCityKey] || DEFAULT_SCHEDULE;
    const fallbackDay = staticSchedule[(dayNum - 1) % staticSchedule.length];

    if (apiResult?.itinerary?.activities?.length > 0) {
      const dayActivities = apiResult.itinerary.activities.filter(a => a.day === dayNum);
      
      const morningAct = dayActivities[0];
      const afternoonAct = dayActivities[1];
      const eveningAct = dayActivities[2];

      return {
        Morning: (morningAct && morningAct.name) ? { 
          name: morningAct.name, 
          type: morningAct.type || fallbackDay.Morning.type, 
          icon: morningAct.icon || fallbackDay.Morning.icon || '🌿', 
          swapped: morningAct.swapped 
        } : fallbackDay.Morning,
        Afternoon: (afternoonAct && afternoonAct.name) ? { 
          name: afternoonAct.name, 
          type: afternoonAct.type || fallbackDay.Afternoon.type, 
          icon: afternoonAct.icon || fallbackDay.Afternoon.icon || '☀️', 
          swapped: afternoonAct.swapped 
        } : fallbackDay.Afternoon,
        Evening: (eveningAct && eveningAct.name) ? { 
          name: eveningAct.name, 
          type: eveningAct.type || fallbackDay.Evening.type, 
          icon: eveningAct.icon || fallbackDay.Evening.icon || '🌙', 
          swapped: eveningAct.swapped 
        } : fallbackDay.Evening,
      };
    }
    return fallbackDay;
  };

  const totalDays = apiResult ? apiResult.itinerary.days : durationDays;
  const weather = apiResult?.weather;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900 flex flex-col relative overflow-x-hidden">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-medium transition-all">
          {toastMessage}
        </div>
      )}

      {/* Hero Background */}
      <div className="absolute inset-0 z-0 h-[680px] pointer-events-none overflow-hidden">
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover transition-all duration-1000"
          key={bgImage}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/75 to-[#F8FAFC]" />
      </div>

      {/* ─── HEADER ─── */}
      <header className="relative z-20 bg-white/85 backdrop-blur-xl border-b border-slate-100/80 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[70px] flex items-center justify-between gap-4">

          <button className="flex items-center gap-3 group" onClick={handleBack}>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-md shadow-teal-600/25 group-hover:shadow-lg group-hover:shadow-teal-600/30 transition-all">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">RouteScout</h1>
              <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-[0.15em] mt-0.5">The Global Travel Suite</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${apiConnected ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? 'bg-teal-500' : 'bg-amber-400 animate-pulse'}`} />
              {apiConnected ? 'Live Travel Service' : 'Offline Mode'}
            </div>

            {view === 2 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 font-bold text-sm rounded-xl shadow-sm transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Modify Search
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8 md:py-14">

        {/* ═══════════════════════════════════════════════════════════
            VIEW 1 — LANDING / DISCOVERY HUB
        ═══════════════════════════════════════════════════════════ */}
        {view === 1 && !isGenerating && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">

            {/* Left: Hero Copy */}
            <div className="lg:col-span-5 pt-2 lg:pt-10 space-y-7">

              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">India & World Destinations Expanded</span>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.08] mb-4">
                  Craft Your <br />
                  <span className="text-teal-600">Ultimate Escape.</span>
                </h2>
                <p className="text-slate-600 text-base font-medium leading-relaxed max-w-sm">
                  A premium personal travel companion designing customised, weather-optimised schedules perfectly tailored from 1 up to 7 days.
                </p>
              </div>

              {/* Destination Preview */}
              {matchedCity && (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 shadow-sm flex gap-4 items-center overflow-hidden">
                  <img src={matchedCity.image} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 shadow-sm" alt={activeCityKey} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-black text-slate-900">{activeCityKey}</h4>
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{matchedCity.tagline}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{matchedCity.desc}</p>
                  </div>
                </div>
              )}

              {/* Popular India Quick-Select */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Popular Indian Destinations</p>
                <div className="flex flex-wrap gap-2">
                  {['Jaipur', 'Bengaluru', 'Hyderabad', 'Chennai', 'Mumbai'].map(city => (
                    <button
                      key={city}
                      onClick={() => { setIsCustomCity(false); setDestination(city); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${destination === city && !isCustomCity
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700'
                        }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Parameter Panel */}
            <div className="lg:col-span-7 bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 p-7 md:p-10 space-y-7">

              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-50">
                <div className="w-8 h-8 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-none">Plan Your Journey</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Set your travel destination and trip dates</p>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Choose Your Destination</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 pointer-events-none" />
                    <select
                      value={isCustomCity ? 'CUSTOM' : destination}
                      onChange={(e) => handleCitySelect(e.target.value)}
                      className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10 cursor-pointer hover:border-slate-300 transition-all"
                    >
                      <optgroup label="India">
                        {['Bengaluru', 'Jaipur', 'Hyderabad', 'Chennai', 'Mumbai'].map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="World">
                        {['Paris', 'Tokyo', 'Singapore', 'London', 'San Diego'].map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <option value="CUSTOM">Custom City…</option>
                    </select>
                  </div>
                  {isCustomCity && (
                    <input
                      type="text"
                      placeholder="e.g. New York, Bali…"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 px-4 py-3.5 rounded-2xl text-sm font-bold focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10"
                    />
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Journey Start', val: startDate, set: setStartDate, id: 'sd' },
                  { label: 'Journey End', val: endDate, set: setEndDate, id: 'ed' }
                ].map(({ label, val, set, id }) => (
                  <div key={id} className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{label}</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date" value={val} onChange={(e) => set(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-10 pr-3 py-3.5 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10 hover:border-slate-300 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Duration info badge */}
              <div className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 border text-xs transition-all ${isDurationValid
                ? 'bg-teal-50/60 border-teal-100 text-teal-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isDurationValid ? `${durationDays}-Day Journey Selected` : 'Invalid Date Range'}
                  </span>
                  <span className="font-medium text-opacity-80 ml-1">
                    {isDurationValid
                      ? '— Your trip duration fits your selected personalised parameters flawlessly.'
                      : '— Please select dates for a journey between 1 and 7 days.'}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleGenerate}
                disabled={!isDurationValid}
                className="w-full relative overflow-hidden group bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-base py-4.5 py-[18px] rounded-2xl shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30 transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <span>Generate My Custom Itinerary</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            VIEW 1.5 — LOADING / CURATING SCREEN
        ═══════════════════════════════════════════════════════════ */}
        {isGenerating && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-10 max-w-md w-full space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Curating Your Escape</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Your personalised journey is being crafted…</p>
                </div>
              </div>

              <div className="space-y-4">
                {LOADING_STEPS.map((step, idx) => {
                  const done = idx < generateStep;
                  const active = idx === generateStep;
                  return (
                    <div key={idx} className={`flex items-center gap-3.5 transition-all duration-300 ${active ? 'opacity-100' : done ? 'opacity-50' : 'opacity-25'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border flex-shrink-0 transition-all ${done ? 'bg-teal-500 border-teal-500 text-white' : active ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-slate-200 text-slate-400'}`}>
                        {done ? <Check className="w-3.5 h-3.5" /> : <span className="text-base">{step.icon}</span>}
                      </div>
                      <p className={`text-sm font-semibold ${active ? 'text-teal-700' : 'text-slate-600'}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>

              {matchedCity && (
                <div className="relative rounded-2xl overflow-hidden h-24">
                  <img src={matchedCity.image} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent flex items-center px-5">
                    <div>
                      <p className="text-white font-black text-lg leading-none">{activeCityKey}</p>
                      <p className="text-teal-300 text-xs font-bold mt-0.5">{matchedCity.tagline}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            VIEW 2 — MASTER ITINERARY CANVAS
        ═══════════════════════════════════════════════════════════ */}
        {view === 2 && (
          <div className="space-y-8">

            {/* Top Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 font-bold text-sm rounded-xl shadow-sm transition-all duration-200 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  ← Back to Search
                </button>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{activeCityKey}</h2>
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mt-1">
                    {durationDays}-Day Curated Experience  •  {startDate} → {endDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {weather && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm ${weather.bad_weather ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-teal-50 border-teal-200 text-teal-800'}`}>
                    {weather.bad_weather ? <CloudRain className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>{weather.forecast}</span>
                    <span className="text-xs font-normal opacity-70">{weather.temperature_c}°C</span>
                    {weather.bad_weather && apiResult?.itinerary?.swaps_made > 0 && (
                      <span className="ml-1 text-[10px] bg-amber-500 text-white rounded-full px-2 py-0.5 font-extrabold">
                        {apiResult.itinerary.swaps_made} SWAPS
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Day Tab Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
              {Array.from({ length: totalDays }).map((_, i) => {
                const d = i + 1;
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDayTab(d)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${activeDayTab === d
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700'
                      }`}
                  >
                    Day {d}
                  </button>
                );
              })}
            </div>

            {/* Multi-Day Cards Grid */}
            {/* On desktop: show 3 columns side-by-side per day. On mobile: stacked. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3">
              {['Morning', 'Afternoon', 'Evening'].map((period, periodIdx) => {
                const schedule = getScheduleForDay(activeDayTab);
                const activity = schedule?.[period];
                const periodConfig = {
                  Morning: { gradient: 'from-amber-50 to-orange-50', border: 'border-amber-100', dot: 'bg-amber-400', label: '🌅 Morning', time: '8:00 AM – 12:00 PM' },
                  Afternoon: { gradient: 'from-sky-50 to-blue-50', border: 'border-sky-100', dot: 'bg-sky-400', label: '☀️ Afternoon', time: '12:00 PM – 6:00 PM' },
                  Evening: { gradient: 'from-violet-50 to-purple-50', border: 'border-violet-100', dot: 'bg-violet-400', label: '🌙 Evening', time: '6:00 PM – 10:00 PM' },
                }[period];

                return (
                  <div
                    key={period}
                    className={`group bg-white border ${periodConfig.border} rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}
                  >
                    {/* Card Header Band */}
                    <div className={`bg-gradient-to-br ${periodConfig.gradient} px-6 py-4 border-b ${periodConfig.border} flex items-center justify-between`}>
                      <div>
                        <p className="text-sm font-extrabold text-slate-700">{periodConfig.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{periodConfig.time}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${periodConfig.dot} shadow-sm`} />
                    </div>

                    {/* Activity Block */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                      {activity ? (
                        <>
                          <div className="space-y-3">
                            <div className="text-3xl">{activity.icon || '📍'}</div>
                            <div>
                              <h4 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-teal-800 transition-colors">
                                {activity.name}
                              </h4>
                              {activity.swapped && (
                                <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                  <CloudRain className="w-3 h-3" />
                                  Weather Swap Applied
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border ${getTypeColor(activity.type)}`}>
                              {activity.type}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                              <Check className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-slate-300 text-sm font-medium">No activity scheduled</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day Navigation Footer Row */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveDayTab(d => Math.max(1, d - 1))}
                disabled={activeDayTab === 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Day
              </button>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Day {activeDayTab} of {totalDays}
              </span>
              <button
                onClick={() => setActiveDayTab(d => Math.min(totalDays, d + 1))}
                disabled={activeDayTab === totalDays}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 transition-all"
              >
                Next Day
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Full Summary Banner (shows if API returned data) */}
            {apiResult && (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {weather?.bad_weather ? <CloudRain className="w-6 h-6 text-amber-500" /> : <Sun className="w-6 h-6 text-teal-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{weather?.forecast}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-semibold">
                      <span>{weather?.temperature_c}°C</span>
                      <span>•</span>
                      <span>Humidity {weather?.humidity_percent}%</span>
                      <span>•</span>
                      <span>UV {weather?.uv_index}</span>
                    </div>
                  </div>
                </div>
                {weather?.bad_weather && apiResult.itinerary?.swaps_made > 0 && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 max-w-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      <strong>Weather-smart adjustments</strong> — {apiResult.itinerary.swaps_made} outdoor activities have been swapped for indoor alternatives.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
