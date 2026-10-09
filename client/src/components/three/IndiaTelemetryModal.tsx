import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import {
  X,
  Search,
  Train,
  Trees,
  Building2,
  Landmark,
  Globe,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Info,
  BookOpen,
  Map,
} from 'lucide-react';
import { IndiaVectorMap } from './IndiaVectorMap';

export type PortalCategory =
  | 'railway'
  | 'gram_panchayat'
  | 'municipal'
  | 'central_govt'
  | 'state_govt';

export interface IndiaGovNode {
  id: string;
  name: string;
  category: PortalCategory;
  categoryLabel: string;
  stateOrZone: string;
  district?: string;
  complianceRate: number;
  lat: number;
  lon: number;
  services: string[];
  colorHex: string;
  color: number;
  portalUrl?: string;
  description: string;
}

export interface StatePanchayatCoverage {
  state: string;
  panchayatCount: number;
  portalName: string;
  portalUrl: string;
  services: string[];
  complianceRate: number;
  highlight: string;
}

// Complete Ministry of Panchayati Raj & Local Government Directory (LGD) National Inventory
// Total: 2,55,248 Gram Panchayats across 28 States and 8 Union Territories
export const NATIONAL_PANCHAYAT_DIRECTORY: StatePanchayatCoverage[] = [
  {
    state: 'Uttar Pradesh',
    panchayatCount: 58189,
    portalName: 'e-Panchayat UP (PRD)',
    portalUrl: 'https://panchayatiraj.up.nic.in',
    services: ['Family Register', 'Panchayat Bhavan Wi-Fi', 'Gram Nidhi Accounts', 'Birth/Death Registry'],
    complianceRate: 86,
    highlight: 'Largest rural panchayat network in India with 58,189 village secretariats.',
  },
  {
    state: 'Maharashtra',
    panchayatCount: 27920,
    portalName: 'MahaEgram Citizen Portal',
    portalUrl: 'https://mahaegram.maharashtra.gov.in',
    services: ['Village Tax Assessment', 'Gram Sabha Resolutions', '7/12 Digital Mutation', 'Water Dues'],
    complianceRate: 91,
    highlight: 'Pioneered digital Gram Sabha livestreaming and e-tendering across 27,920 GPs.',
  },
  {
    state: 'Madhya Pradesh',
    panchayatCount: 22812,
    portalName: 'Panchayat Darpan MP',
    portalUrl: 'https://panchayatdarpan.mp.gov.in',
    services: ['Samagra Portal Sync', 'Panchayat Accounts', 'Kisan Kalyan Records', 'MGNREGA Audits'],
    complianceRate: 88,
    highlight: 'Unified geo-tagging and public dashboard for 22,812 rural village councils.',
  },
  {
    state: 'Gujarat',
    panchayatCount: 14242,
    portalName: 'e-Gram Vishwagram Gujarat',
    portalUrl: 'https://panchayat.gujarat.gov.in',
    services: ['VSAT Village Broadband', 'AnyRoR 7/12 Land Dues', 'e-Mitra Gram Centres', 'E-Pramaan'],
    complianceRate: 94,
    highlight: '100% broadband connectivity across all 14,242 village panchayats.',
  },
  {
    state: 'Andhra Pradesh',
    panchayatCount: 13371,
    portalName: 'Grama Sachivalayam AP',
    portalUrl: 'https://gramawardsachivalayam.ap.gov.in',
    services: ['Navaratnalu Welfare Kiosks', 'Doorstep Delivery', 'Integrated Certificate Desk'],
    complianceRate: 93,
    highlight: '15,000+ village secretariats delivering 500+ citizen services within 72 hours.',
  },
  {
    state: 'Punjab',
    panchayatCount: 13241,
    portalName: 'PBRDP e-Panchayat Portal',
    portalUrl: 'https://pbrdp.gov.in',
    services: ['Shamlat Land Registry', 'Gram Sabha e-Monitoring', 'Rural Sanitation Dashboard'],
    complianceRate: 87,
    highlight: 'Digitized common land (Shamlat) records and rural fund allocations.',
  },
  {
    state: 'Telangana',
    panchayatCount: 12769,
    portalName: 'Palle Pragathi Digital Portal',
    portalUrl: 'https://epanchayat.telangana.gov.in',
    services: ['Palle Prakruthi Vanam Audit', 'Tractor Telemetry', 'T-Fiber Rural Grid', 'Property Tax'],
    complianceRate: 92,
    highlight: 'Integrated village green audit and 100% T-Fiber high-speed optical grid.',
  },
  {
    state: 'Tamil Nadu',
    panchayatCount: 12525,
    portalName: 'TNRD Village Panchayat Portal',
    portalUrl: 'https://tnrd.tn.gov.in',
    services: ['Namma Gramam App', 'Water Supply Automation', 'House Tax Online', 'Welfare Kiosks'],
    complianceRate: 93,
    highlight: 'Comprehensive village GIS asset tracking across all 12,525 panchayats.',
  },
  {
    state: 'Chhattisgarh',
    panchayatCount: 11664,
    portalName: 'ePanchayat Chhattisgarh',
    portalUrl: 'https://prd.cg.gov.in',
    services: ['Gauthan Telemetry', 'Forest Rights (FRA) e-Desk', 'Village Development Index'],
    complianceRate: 86,
    highlight: 'Extensive tribal forest rights digitisation and rural livelihood hubs.',
  },
  {
    state: 'Rajasthan',
    panchayatCount: 11283,
    portalName: 'RajPanchayat Portal',
    portalUrl: 'https://rajpanchayat.rajasthan.gov.in',
    services: ['e-Mitra Village Kiosks', 'Jan Soochna Transparency', 'Panchayat Accounts PES'],
    complianceRate: 90,
    highlight: 'Pioneered proactive public disclosure under Rajasthan RTI for 11,283 GPs.',
  },
  {
    state: 'Bihar',
    panchayatCount: 8387,
    portalName: 'Bihar Panchayat Monitoring Portal',
    portalUrl: 'https://biharpanchayat.bihar.gov.in',
    services: ['Saat Nishchay Nal-Jal Audit', 'Panchayat Sarkar Bhawan Desk', 'RTPS Services'],
    complianceRate: 85,
    highlight: 'Panchayat Sarkar Bhawans delivering localized digital government services.',
  },
  {
    state: 'Uttarakhand',
    panchayatCount: 7791,
    portalName: 'Uttarakhand Panchayati Raj',
    portalUrl: 'https://panchayat.uk.gov.in',
    services: ['Apuni Sarkar Hill Kiosks', 'Disaster Relief Registry', 'Eco-Panchayat Audits'],
    complianceRate: 88,
    highlight: 'High-altitude village council connectivity across Himalayan districts.',
  },
  {
    state: 'Odisha',
    panchayatCount: 6798,
    portalName: 'PR&DW Odisha Rural Portal',
    portalUrl: 'https://pr.odisha.gov.in',
    services: ['Mo Seba Kendra Integration', 'Cyclone Preparedness Alert', '5T Village Audit'],
    complianceRate: 91,
    highlight: 'Coastal disaster resilience and 5T governance monitoring in 6,798 GPs.',
  },
  {
    state: 'Haryana',
    panchayatCount: 6225,
    portalName: 'Haryana e-Panchayat',
    portalUrl: 'https://haryanaepanchayat.gov.in',
    services: ['Gram Darshan Portal', 'Lal Dora Mukt Property Cards', 'Parivar Pehchan Patra'],
    complianceRate: 92,
    highlight: 'First state to complete 100% Lal Dora mapping via drone surveys in all GPs.',
  },
  {
    state: 'Karnataka',
    panchayatCount: 6024,
    portalName: 'Panchamitra & Bapuji Seva Kendra (BSK)',
    portalUrl: 'https://panchamitra.kar.nic.in',
    services: ['Form 9 & Form 11 e-Swathu', 'BSK 100+ Citizen Services', 'Rural Drinking Water', 'Grama Sabha e-Sync'],
    complianceRate: 96,
    highlight: 'Bapuji Seva Kendras (BSK) active in all 6,024 GPs with e-Swathu property deeds.',
  },
  {
    state: 'Jharkhand',
    panchayatCount: 4345,
    portalName: 'Jharkhand Panchayati Raj',
    portalUrl: 'https://panchayat.jharkhand.gov.in',
    services: ['Pragya Kendra Services', 'Jharbhoomi Land Sync', 'Tribal Welfare Kiosks'],
    complianceRate: 85,
    highlight: 'Pragya Kendras operating across scheduled areas and mining village belts.',
  },
  {
    state: 'Jammu & Kashmir',
    panchayatCount: 4291,
    portalName: 'J&K e-Panchayat Portal',
    portalUrl: 'https://jkpanchayat.nic.in',
    services: ['Back to Village (B2V) Tracking', 'Janbhagidari Empowerment', 'Digital Land Records'],
    complianceRate: 89,
    highlight: 'B2V program tracking public asset delivery in all 4,291 Halqa Panchayats.',
  },
  {
    state: 'Himachal Pradesh',
    panchayatCount: 3615,
    portalName: 'e-Panchayat Himachal',
    portalUrl: 'https://hppanchayat.nic.in',
    services: ['Lokmitra Kendra Desk', 'Parivar Register', 'Snow-Bound Village Connectivity'],
    complianceRate: 91,
    highlight: 'High-altitude cold desert and mountain village council integration.',
  },
  {
    state: 'West Bengal',
    panchayatCount: 3340,
    portalName: 'WBPRD Rural Development Portal',
    portalUrl: 'https://wbprd.gov.in',
    services: ['Bangla Sahayata Kendra (BSK)', 'Gram Unnayan Samiti Audits', 'Duare Sarkar Sync'],
    complianceRate: 88,
    highlight: 'Bangla Sahayata Kendras delivering free digital public services in all GPs.',
  },
  {
    state: 'Assam',
    panchayatCount: 2197,
    portalName: 'Assam PNRD Portal',
    portalUrl: 'https://pnrd.assam.gov.in',
    services: ['Panchayat Development Plan (GPDP)', 'Flood Relief Registry', 'Rural Livelihood Desk'],
    complianceRate: 87,
    highlight: 'Flood resilience telemetry and riverine char area village administration.',
  },
  {
    state: 'Kerala',
    panchayatCount: 941,
    portalName: 'LSGD Sanchitha & IKM Portal',
    portalUrl: 'https://lsgkerala.gov.in',
    services: ['K-SMART ERP Suite', 'Sevana Civil Registration', 'Sanchitha Building Rules', 'Akshaya Kiosks'],
    complianceRate: 97,
    highlight: '100% digital literacy and K-SMART unified municipal/panchayat ERP across all 941 GPs.',
  },
  {
    state: 'Tripura',
    panchayatCount: 589,
    portalName: 'Tripura Panchayati Raj',
    portalUrl: 'https://panchayat.tripura.gov.in',
    services: ['Village Council Kiosks', 'e-GramSwaraj', 'Direct Benefit Transfer Desk'],
    complianceRate: 88,
    highlight: 'Autonomous District Council (TTAADC) and traditional village council integration.',
  },
  {
    state: 'Goa',
    panchayatCount: 191,
    portalName: 'Goa Panchayat Directorate',
    portalUrl: 'https://panchayatsgoa.gov.in',
    services: ['Online Construction License', 'Trade N.O.C.', 'House Tax e-Payment'],
    complianceRate: 94,
    highlight: 'Coastal tourism waste management and 100% computerized village certificates.',
  },
  {
    state: 'Sikkim',
    panchayatCount: 185,
    portalName: 'Sikkim Rural Development',
    portalUrl: 'https://sikkimrmdd.gov.in',
    services: ['100% Organic Village Certification', 'Eco-Tourism Registry', 'Village Plan Desk'],
    complianceRate: 93,
    highlight: 'Organic farming village audits and Himalayan eco-governance councils.',
  },
  {
    state: 'North-East Hill Councils & UTs',
    panchayatCount: 512,
    portalName: 'Ministry of Panchayati Raj / UT Administration',
    portalUrl: 'https://egramswaraj.gov.in',
    services: ['Autonomous Hill Councils (Nagaland, Mizoram, Meghalaya)', 'UT Rural Secretariats'],
    complianceRate: 90,
    highlight: 'Constitutional 6th schedule autonomous hill councils and island UT secretariats.',
  },
];

// Comprehensive National Indian Government Web & Offices Dataset
export const ALL_INDIA_GOV_NODES: IndiaGovNode[] = [
  // ─── 1. INDIAN RAILWAYS & TRANSIT GATEWAYS ─────────
  {
    id: 'rail-irctc',
    name: 'IRCTC NextGen Passenger Gateway',
    category: 'railway',
    categoryLabel: 'Indian Railways Gateway',
    stateOrZone: 'National Transit Network',
    district: 'New Delhi HQ',
    complianceRate: 95,
    lat: 28.6328,
    lon: 77.2197,
    services: ['E-Ticketing (PRS/UTS)', 'PNR Enquiry', 'Catering Portal', 'Accessible Special Trains'],
    colorHex: 'rgba(6, 182, 212, 0.95)', // Cyan
    color: 0x06b6d4,
    portalUrl: 'https://irctc.co.in',
    description: 'Premier national passenger rail ticketing infrastructure serving 1.5+ crore daily citizens.',
  },
  {
    id: 'rail-indianrail',
    name: 'Ministry of Railways Official Portal',
    category: 'railway',
    categoryLabel: 'Ministry of Railways',
    stateOrZone: 'Rail Bhavan, New Delhi',
    complianceRate: 93,
    lat: 28.619,
    lon: 77.215,
    services: ['Freight Operations', 'Citizen Grievance RailMadad', 'Tenders & Contracts', 'Policy Circulars'],
    colorHex: 'rgba(6, 182, 212, 0.95)',
    color: 0x06b6d4,
    portalUrl: 'https://indianrailways.gov.in',
    description: 'Central portal for policy, freight corridors, and passenger safety circulars across all 18 zones.',
  },
  {
    id: 'rail-southern',
    name: 'Southern Railway Gateway',
    category: 'railway',
    categoryLabel: 'Zonal Railway HQ',
    stateOrZone: 'Southern Zone',
    district: 'Chennai HQ',
    complianceRate: 91,
    lat: 13.0827,
    lon: 80.2755,
    services: ['Suburban Rail Timetable', 'Season Ticket Portal', 'Divisional Grievances'],
    colorHex: 'rgba(6, 182, 212, 0.95)',
    color: 0x06b6d4,
    portalUrl: 'https://sr.indianrailways.gov.in',
    description: 'Zonal portal managing Tamil Nadu, Kerala, and southern Karnataka transit lines.',
  },
  {
    id: 'rail-western',
    name: 'Western Railway HQ',
    category: 'railway',
    categoryLabel: 'Zonal Railway HQ',
    stateOrZone: 'Western Zone',
    district: 'Mumbai Churchgate',
    complianceRate: 92,
    lat: 18.9322,
    lon: 72.8264,
    services: ['Mumbai Suburban Telemetry', 'Local Pass Renewal', 'Station Accessibility Guide'],
    colorHex: 'rgba(6, 182, 212, 0.95)',
    color: 0x06b6d4,
    portalUrl: 'https://wr.indianrailways.gov.in',
    description: 'Heavy commuter suburban gateway serving Mumbai metropolitan line with step-free navigation.',
  },
  {
    id: 'rail-konkan',
    name: 'Konkan Railway Corporation (KRCL)',
    category: 'railway',
    categoryLabel: 'Coastal Rail Network',
    stateOrZone: 'Konkan Coast (MH, Goa, KA)',
    district: 'Navi Mumbai & Mangaluru',
    complianceRate: 90,
    lat: 19.0178,
    lon: 73.018,
    services: ['Coastal Rail Tracking', 'Monsoon Safety Alerts', 'Freight Ro-Ro Telemetry'],
    colorHex: 'rgba(6, 182, 212, 0.95)',
    color: 0x06b6d4,
    portalUrl: 'https://konkanrailway.com',
    description: 'Scenic mountainous and coastal railway linking Maharashtra, Goa, and coastal Karnataka.',
  },
  {
    id: 'rail-swr',
    name: 'South Western Railway (SWR)',
    category: 'railway',
    categoryLabel: 'Zonal Railway HQ',
    stateOrZone: 'Karnataka HQ',
    district: 'Hubballi',
    complianceRate: 92,
    lat: 15.3524,
    lon: 75.1432,
    services: ['Bengaluru Suburban Tracking', 'Divisional Employment Portal', 'Freight Seva'],
    colorHex: 'rgba(6, 182, 212, 0.95)',
    color: 0x06b6d4,
    portalUrl: 'https://swr.indianrailways.gov.in',
    description: 'Direct zonal administration of Bengaluru, Mysuru, and Hubballi railway divisions.',
  },
  {
    id: 'rail-railwire',
    name: 'RailWire Citizen Internet & Seva',
    category: 'railway',
    categoryLabel: 'RailTel Infrastructure',
    stateOrZone: 'National Station Wi-Fi',
    district: 'New Delhi HQ',
    complianceRate: 94,
    lat: 28.5833,
    lon: 77.225,
    services: ['Free Station Wi-Fi Gateway', 'Rural Broadband', 'Video Surveillance Feeds'],
    colorHex: 'rgba(6, 182, 212, 0.95)',
    color: 0x06b6d4,
    portalUrl: 'https://railwire.co.in',
    description: 'Public Wi-Fi and high-speed broadband network operating across 6,100+ railway stations in India.',
  },

  // ─── 2. GRAM PANCHAYATS & GRASSROOTS GOVERNANCE (2,55,248 PANCHAYATS NATIONWIDE) ─────
  // A. Sovereign Umbrella & State Federated Gateways (covering all 2.55 Lakh Panchayats)
  {
    id: 'gp-fed-national',
    name: 'eGramSwaraj National Panchayat Gateway (2,55,248 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'National Panchayat Gateway',
    stateOrZone: 'Ministry of Panchayati Raj, New Delhi',
    district: 'All-India Sovereign Umbrella',
    complianceRate: 95,
    lat: 28.6145,
    lon: 77.215,
    services: ['eGramSwaraj Unified Accounting', 'Local Government Directory (LGD)', 'Gram Manchitra GIS', 'AuditOnline'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://egramswaraj.gov.in',
    description: 'Premier sovereign national portal integrating all 2,55,248 Gram Panchayats, 6,700 Block Panchayats, and 765 Zilla Parishads across India.',
  },
  {
    id: 'gp-fed-karnataka',
    name: 'Karnataka Panchamitra Rural Gateway (6,024 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Karnataka RDPR',
    district: 'Bengaluru Secretariat',
    complianceRate: 96,
    lat: 12.9716,
    lon: 77.5946,
    services: ['Form 9 & 11 e-Swathu', 'Bapuji Seva Kendra (BSK)', 'Rural Drinking Water Telemetry', 'Grama Sabha e-Sync'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://panchamitra.kar.nic.in',
    description: 'Digital command platform for all 6,024 Karnataka Gram Panchayats powering BSK service delivery and e-Swathu property cards.',
  },
  {
    id: 'gp-fed-maharashtra',
    name: 'MahaEgram Maharashtra Rural Gateway (27,920 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Maharashtra Rural Dev',
    district: 'Mumbai HQ',
    complianceRate: 92,
    lat: 18.922,
    lon: 72.834,
    services: ['e-Gram Sabha Live', 'Village Tax Assessment', '7/12 Digital Mutation', 'Rural Tendering Portal'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://mahaegram.maharashtra.gov.in',
    description: 'Unified digital backbone covering all 27,920 Gram Panchayats across 34 rural districts in Maharashtra.',
  },
  {
    id: 'gp-fed-up',
    name: 'e-Panchayat Uttar Pradesh Gateway (58,189 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Uttar Pradesh PRD',
    district: 'Lucknow Secretariat',
    complianceRate: 88,
    lat: 26.8467,
    lon: 80.9462,
    services: ['Panchayat Bhavan Wi-Fi Desk', 'Family Parivar Register', 'Gram Nidhi Accounts', 'Birth/Death Verification'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://panchayatiraj.up.nic.in',
    description: 'Largest rural panchayat governance network in the Republic of India managing 58,189 village secretariats.',
  },
  {
    id: 'gp-fed-tn',
    name: 'TNRD Tamil Nadu Village Gateway (12,525 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Tamil Nadu Rural Dev',
    district: 'Chennai Panagal Building',
    complianceRate: 94,
    lat: 13.0418,
    lon: 80.2341,
    services: ['Namma Gramam Asset GIS', 'House Tax Online', 'Drinking Water Automation', 'Welfare Kiosks'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://tnrd.tn.gov.in',
    description: 'Digital portal connecting all 12,525 Village Panchayats across Tamil Nadu with GIS-mapped public works.',
  },
  {
    id: 'gp-fed-kerala',
    name: 'LSGD Sanchitha & IKM Kerala (941 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Kerala LSGD',
    district: 'Thiruvananthapuram',
    complianceRate: 97,
    lat: 8.5074,
    lon: 76.9558,
    services: ['K-SMART Unified ERP', 'Sevana Civil Registration', 'Sanchitha Building Rules', 'Akshaya Kiosks'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://lsgkerala.gov.in',
    description: '100% digitally literate village panchayat grid providing instantaneous civil registration across all 941 Kerala GPs.',
  },
  {
    id: 'gp-fed-gujarat',
    name: 'e-Gram Vishwagram Gujarat (14,242 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Gujarat Panchayats',
    district: 'Gandhinagar Sachivalaya',
    complianceRate: 95,
    lat: 23.2156,
    lon: 72.6369,
    services: ['VSAT Broadband Kiosks', 'AnyRoR Land Registry', 'e-Mitra Gram Centres', 'E-Pramaan Desk'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://panchayat.gujarat.gov.in',
    description: 'Pioneering fiber-connected village network delivering 200+ online certificates to all 14,242 Gujarat Gram Panchayats.',
  },
  {
    id: 'gp-fed-ap',
    name: 'Andhra Pradesh Grama Sachivalayam (13,371 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Andhra Pradesh PR&RD',
    district: 'Amaravati Secretariat',
    complianceRate: 93,
    lat: 16.5131,
    lon: 80.5165,
    services: ['Navaratnalu Welfare Kiosks', 'Doorstep Delivery Registry', 'Integrated Citizen Desk', 'Spandana Grievances'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://gramawardsachivalayam.ap.gov.in',
    description: 'Decentralized governance model operating 15,000+ village secretariats with dedicated grassroots functionaries.',
  },
  {
    id: 'gp-fed-telangana',
    name: 'Telangana Palle Pragathi Gateway (12,769 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Telangana PR&RD',
    district: 'Hyderabad Secretariat',
    complianceRate: 93,
    lat: 17.385,
    lon: 78.4867,
    services: ['T-Fiber Optical Grid', 'Palle Prakruthi Vanam Audit', 'Gram Panchayat Tax Desk', 'Sanitation Telemetry'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://epanchayat.telangana.gov.in',
    description: 'State-wide high-speed rural fiber network and ecological auditing across all 12,769 Gram Panchayats in Telangana.',
  },
  {
    id: 'gp-fed-rajasthan',
    name: 'Rajasthan RajPanchayat Gateway (11,283 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Rajasthan Panchayati Raj',
    district: 'Jaipur Secretariat',
    complianceRate: 91,
    lat: 26.9124,
    lon: 75.7873,
    services: ['Jan Soochna Transparency Desk', 'e-Mitra Rural Kiosks', 'PES Accounts Audit', 'Panchayat Grievances'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://rajpanchayat.rajasthan.gov.in',
    description: 'First Indian state to adopt the 73rd Amendment (Nagaur 1959), now managing 11,283 digital Gram Panchayats.',
  },
  {
    id: 'gp-fed-mp',
    name: 'Madhya Pradesh Panchayat Darpan (22,812 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Madhya Pradesh PRD',
    district: 'Bhopal Vallabh Bhavan',
    complianceRate: 89,
    lat: 23.2599,
    lon: 77.4126,
    services: ['Samagra Social Security Sync', 'Panchayat Fund Portal', 'Kisan Kalyan Records', 'MGNREGA Work Audits'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://panchayatdarpan.mp.gov.in',
    description: 'Geospatial transparency platform monitoring budget execution for 22,812 rural village councils.',
  },
  {
    id: 'gp-fed-wb',
    name: 'West Bengal PRD Rural Gateway (3,340 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'West Bengal PRD',
    district: 'Kolkata Salt Lake',
    complianceRate: 89,
    lat: 22.5804,
    lon: 88.4237,
    services: ['Bangla Sahayata Kendra (BSK)', 'Gram Unnayan Samiti Audits', 'Duare Sarkar Sync', 'Rural Works Telemetry'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://wbprd.gov.in',
    description: 'Unified administrative network managing large-population Gram Panchayats across 22 West Bengal districts.',
  },
  {
    id: 'gp-fed-bihar',
    name: 'Bihar Panchayati Raj Gateway (8,387 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Bihar Panchayati Raj',
    district: 'Patna Secretariat',
    complianceRate: 86,
    lat: 25.5941,
    lon: 85.1376,
    services: ['Saat Nishchay Nal-Jal Telemetry', 'Panchayat Sarkar Bhawan Desk', 'RTPS Online Services'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://biharpanchayat.bihar.gov.in',
    description: 'Decentralized public administration delivering digital governance through 8,387 Panchayat Sarkar Bhawans.',
  },
  {
    id: 'gp-fed-odisha',
    name: 'Odisha PR&DW Rural Gateway (6,798 GPs)',
    category: 'gram_panchayat',
    categoryLabel: 'State Rural Gateway',
    stateOrZone: 'Odisha PR&DW',
    district: 'Bhubaneswar',
    complianceRate: 92,
    lat: 20.2961,
    lon: 85.8245,
    services: ['Mo Seba Kendra Integration', 'Cyclone Warning Telemetry', 'Ama Gaon Ama Bikash', 'Panchayat Works'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    portalUrl: 'https://pr.odisha.gov.in',
    description: 'Award-winning disaster-resilient rural governance infrastructure operating in 6,798 coastal and tribal GPs.',
  },

  // B. Representative Village Gram Panchayats Audited Across Coastal & Inland India
  {
    id: 'gp-padubidri',
    name: 'Padubidri Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Udupi District',
    complianceRate: 96,
    lat: 13.1364,
    lon: 74.7816,
    services: ['e-Swathu Form 9 & 11', 'Bapuji Seva Kendra', 'Water Tax Online', 'Coastal Citizen Grievances'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Coastal Karnataka model village panchayat implementing fully digitized panchayat tax receipts.',
  },
  {
    id: 'gp-shirva',
    name: 'Shirva Model Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Udupi District',
    complianceRate: 95,
    lat: 13.2389,
    lon: 74.8394,
    services: ['BSK Citizen Kiosk', 'Solid Waste Resource Management', 'Trade Licenses', 'Khata Extract'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Pioneering coastal village council operating self-funding solid waste management and BSK digital kiosks.',
  },
  {
    id: 'gp-barkur',
    name: 'Barkur Heritage Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Udupi District',
    complianceRate: 94,
    lat: 13.4735,
    lon: 74.7571,
    services: ['Heritage Tourism Registry', 'e-Swathu Dues', 'River Basin Ecology Audit'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Ancient Alupa dynasty capital village combining archaeological heritage preservation with digital land records.',
  },
  {
    id: 'gp-belthangady',
    name: 'Belthangady Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Dakshina Kannada',
    complianceRate: 95,
    lat: 13.0034,
    lon: 75.3039,
    services: ['Western Ghats Ecological Plan', 'Areca Plantation Records', 'BSK e-Pramaan Desk'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Foot-of-the-Ghats panchayat node linking rural farmer collectives and watershed conservation.',
  },
  {
    id: 'gp-sullia',
    name: 'Sullia Rural Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Dakshina Kannada',
    complianceRate: 93,
    lat: 12.5627,
    lon: 75.3912,
    services: ['Rubber Cooperative Sync', 'Property Tax SAS', 'Forest Boundary GIS'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Forest-fringe panchayat serving rubber cultivators and tribal hamlet welfare initiatives.',
  },
  {
    id: 'gp-gokarna',
    name: 'Gokarna Coastal Heritage Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Uttara Kannada',
    complianceRate: 95,
    lat: 14.5426,
    lon: 74.3188,
    services: ['Pilgrimage Civic Telemetry', 'Beach Cleanliness Index', 'Online Building Approvals'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Prominent coastal temple village managing high-density tourist influx and marine ecology protection.',
  },
  {
    id: 'gp-kumta',
    name: 'Kumta Rural Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Uttara Kannada',
    complianceRate: 93,
    lat: 14.4278,
    lon: 74.4239,
    services: ['Betel Nut Market Registry', 'e-GramSwaraj Audit', 'Coastal Mangrove Conservation'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Aghanashini estuary biodiversity panchayat monitoring mangrove blue carbon and artisan fishers.',
  },
  {
    id: 'gp-bailhongal',
    name: 'Bailhongal Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Belagavi District',
    complianceRate: 94,
    lat: 15.8167,
    lon: 74.8667,
    services: ['Cotton Market Yards', 'BSK Direct Benefit Transfer', 'e-Swathu Portal'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Northern Karnataka agrarian panchayat with active Kittur heritage conservation and automated irrigation.',
  },
  {
    id: 'gp-hukkeri',
    name: 'Hukkeri Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Belagavi District',
    complianceRate: 95,
    lat: 16.2239,
    lon: 74.595,
    services: ['Rural Electric Cooperative Kiosk', 'Sugarcane Farmers Desk', 'e-Gram Swaraj'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Home to India’s first Rural Electric Cooperative Society, now operating 100% digital solar energy billing.',
  },
  {
    id: 'gp-hebbal',
    name: 'Hebbal Ward & Panchayat Node',
    category: 'gram_panchayat',
    categoryLabel: 'Panchayat & Ward Office',
    stateOrZone: 'Karnataka',
    district: 'Bengaluru Urban',
    complianceRate: 95,
    lat: 13.0358,
    lon: 77.597,
    services: ['BBMP Sahaaya 2.0', 'Property Tax (SAS)', 'Khata Registration', 'Pothole Grievances'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Urban-rural transition node managing local ward committees and civic welfare schemes.',
  },
  {
    id: 'gp-nanjangud',
    name: 'Nanjangud Rural Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Mysuru District',
    complianceRate: 95,
    lat: 12.1189,
    lon: 76.6781,
    services: ['Kapila River Water Quality', 'BSK Pension Seva', 'Industrial Buffer Zoning'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Kapila river basin model village panchayat balancing industrial park ecology with agrarian livelihoods.',
  },
  {
    id: 'gp-srirangapatna',
    name: 'Srirangapatna Island Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Mandya District',
    complianceRate: 94,
    lat: 12.4228,
    lon: 76.6853,
    services: ['Cauvery Water Management', 'Heritage Building N.O.C.', 'Organic Farming Registry'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'River Cauvery island village panchayat managing historical fortifications and organic farmer markets.',
  },
  {
    id: 'gp-sagar',
    name: 'Sagar Malnad Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Shivamogga District',
    complianceRate: 94,
    lat: 14.167,
    lon: 75.033,
    services: ['Jog Falls Tourist Ecology', 'Forest Rights Recognition', 'Vanilla & Spice Collective'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Malnad highland panchayat integrating Western Ghats rainforest conservation with village e-governance.',
  },
  {
    id: 'gp-thirthahalli',
    name: 'Thirthahalli Tunga Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Shivamogga District',
    complianceRate: 93,
    lat: 13.6892,
    lon: 75.2411,
    services: ['Tunga Riverbank Protection', 'Areca Nut Insurance Sync', 'Village Council e-Notice'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Kuvempu literary homeland village panchayat with 100% digitized primary health and education kiosks.',
  },
  {
    id: 'gp-channapatna',
    name: 'Channapatna Crafts Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Ramanagara District',
    complianceRate: 94,
    lat: 12.6517,
    lon: 77.2056,
    services: ['GI Toy Artisan Registry', 'Silk Cocoon Market Sync', 'BSK Online Welfare'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'World-renowned lacquerware toy craft village supporting hundreds of GI-certified rural artisan families.',
  },
  {
    id: 'gp-madikeri',
    name: 'Madikeri Rural Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Karnataka',
    district: 'Kodagu District',
    complianceRate: 95,
    lat: 12.4244,
    lon: 75.7382,
    services: ['Coffee Agro-Forestry Audit', 'Homestay Regulation Desk', 'Landslide Warning Network'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'High-altitude Coorg plantation panchayat monitoring monsoon rainfall telemetry and sustainable coffee farming.',
  },
  {
    id: 'gp-punsari',
    name: 'Punsari Model Smart Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Smart Panchayat',
    stateOrZone: 'Gujarat',
    district: 'Sabarkantha',
    complianceRate: 98,
    lat: 23.4682,
    lon: 73.0118,
    services: ['e-Gram Centre', 'Smart Public Audio System', 'Digital Education Portal', 'RO Water Gateway'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Award-winning national model digital panchayat with fiber-optic village WiFi, CCTV surveillance, and zero school dropouts.',
  },
  {
    id: 'gp-dharmaj',
    name: 'Dharmaj Heritage NRI Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Gujarat',
    district: 'Anand District',
    complianceRate: 97,
    lat: 22.4206,
    lon: 72.8055,
    services: ['NRI Philanthropy Tracking', 'Underground Drainage Telemetry', 'Tobacco Cooperative Sync'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Affluent model village known as India’s richest rural panchayat with private airstrip, banks, and senior citizen daycare.',
  },
  {
    id: 'gp-madhapar',
    name: 'Madhapar Smart Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Gujarat',
    district: 'Kutch District',
    complianceRate: 96,
    lat: 23.2386,
    lon: 69.7028,
    services: ['Multi-Bank Deposit Monitor', 'Solar Streetlight Grid', 'Earthquake Resilient Building N.O.C.'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'High-GDP Kutch village council housing 17 public banks with total citizen deposits exceeding ₹7,000 crores.',
  },
  {
    id: 'gp-hiware',
    name: 'Hiware Bazar Eco Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Eco Gram Panchayat',
    stateOrZone: 'Maharashtra',
    district: 'Ahmednagar',
    complianceRate: 96,
    lat: 19.0305,
    lon: 74.757,
    services: ['Water Budgeting Portal', 'e-GramSwaraj Audit', 'Groundwater Table Telemetry', 'Zero-Poverty Dashboard'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Renowned sustainable water auditing panchayat with participatory groundwater governance and over 60 village millionaires.',
  },
  {
    id: 'gp-ralegan',
    name: 'Ralegan Siddhi Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    stateOrZone: 'Maharashtra',
    district: 'Ahmednagar',
    complianceRate: 94,
    lat: 19.0068,
    lon: 74.4608,
    services: ['Watershed Management', 'Citizen Seva Kendra', 'Village Welfare Records', 'Grain Bank Portal'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Pioneering watershed harvesting and self-reliant rural village administration founded by Anna Hazare.',
  },
  {
    id: 'gp-patoda',
    name: 'Patoda Model Clean Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Maharashtra',
    district: 'Chhatrapati Sambhajinagar',
    complianceRate: 97,
    lat: 19.8324,
    lon: 75.3129,
    services: ['24x7 Hot-Cold Water Kiosks', 'Automated Flour Mill Token', 'Underground Sewage Telemetry'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'National Swachhata award winner offering free mineral water, free hot water to women, and tree taxes.',
  },
  {
    id: 'gp-baramati',
    name: 'Baramati Rural Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Maharashtra',
    district: 'Pune District',
    complianceRate: 95,
    lat: 18.1528,
    lon: 74.577,
    services: ['Agri-Incubation Rural Desk', 'Drip Irrigation Sensors', 'Milk Chilling Cooperative Sync'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Agri-tech powerhouse village with drone spraying collectives and Krishi Vigyan Kendra digital integration.',
  },
  {
    id: 'gp-shirol',
    name: 'Shirol Sugar Belt Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Maharashtra',
    district: 'Kolhapur District',
    complianceRate: 93,
    lat: 16.7333,
    lon: 74.6,
    services: ['Sugarcane Weight Slips Online', 'Panchganga Flood Warning', 'Fertilizer Quota Portal'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Rich agricultural cooperative village situated along the fertile Panchganga and Krishna river basins.',
  },
  {
    id: 'gp-odanthurai',
    name: 'Odanthurai Green Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    stateOrZone: 'Tamil Nadu',
    district: 'Coimbatore',
    complianceRate: 95,
    lat: 11.3094,
    lon: 76.9427,
    services: ['Renewable Energy Telemetry', 'e-Panchayat Tax', 'Biomass Gasifier Monitor', 'Housing Welfare'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Self-sufficient green village generating its own wind energy and selling surplus power to the state electricity board.',
  },
  {
    id: 'gp-alangulam',
    name: 'Alangulam Model Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Tamil Nadu',
    district: 'Tenkasi District',
    complianceRate: 94,
    lat: 8.8711,
    lon: 77.5028,
    services: ['Cement Worker Welfare Desk', 'Village Solar Grid', 'Online Water Booking'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Southern Tamil Nadu model panchayat with automated water meters and digitized village tax assessments.',
  },
  {
    id: 'gp-kakkodi',
    name: 'Kakkodi Digital Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Digital Gram Panchayat',
    stateOrZone: 'Kerala',
    district: 'Kozhikode',
    complianceRate: 97,
    lat: 11.3126,
    lon: 75.8016,
    services: ['100% e-Literacy Portal', 'Citizen Certificates', 'Building Plan Approvals', 'K-SMART Desk'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Pioneered full digital accessibility for citizen certificates and village council proceedings.',
  },
  {
    id: 'gp-mararikulam',
    name: 'Mararikulam Eco Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Kerala',
    district: 'Alappuzha District',
    complianceRate: 96,
    lat: 9.6053,
    lon: 76.3056,
    services: ['Coastal Bio-Fencing Audit', 'Fisherfolk Direct Pension', 'Responsible Tourism Desk'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Internationally recognized United Nations model village for organic vegetable farming and decentralized poverty alleviation.',
  },
  {
    id: 'gp-mayyil',
    name: 'Mayyil Solar Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Kerala',
    district: 'Kannur District',
    complianceRate: 96,
    lat: 11.9792,
    lon: 75.5083,
    services: ['Solar Rooftop Telemetry', 'Paddy Land Conservation', 'Waste Management Kiosk'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Zero-carbon model panchayat that converted all public buildings and village streetlights to solar microgrids.',
  },
  {
    id: 'gp-gangadevipalli',
    name: 'Gangadevipalli 100% Audited GP',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    stateOrZone: 'Telangana',
    district: 'Warangal District',
    complianceRate: 98,
    lat: 18.0125,
    lon: 79.6208,
    services: ['100% Tax Payment Dashboard', 'Community RO Plant Tokens', 'Total Alcohol Ban Audit', 'e-GramSwaraj'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'National award winner with 100% tax recovery, 100% sanitation coverage, and community-managed drinking water.',
  },
  {
    id: 'gp-ibrahimpur',
    name: 'Ibrahimpur Cashless Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Telangana',
    district: 'Siddipet District',
    complianceRate: 97,
    lat: 18.1018,
    lon: 78.8522,
    services: ['100% UPI Micro-Transactions', 'Solar Water Pump Telemetry', 'Haritha Haram GIS'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'South India’s first 100% cashless, 100% solar village panchayat equipped with micro-ATMs and smart water meters.',
  },
  {
    id: 'gp-kothur',
    name: 'Kothur Peri-Urban Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat',
    stateOrZone: 'Telangana',
    district: 'Rangareddy',
    complianceRate: 92,
    lat: 17.1511,
    lon: 78.2917,
    services: ['Panchayat Secretary e-Desk', 'T-Fiber Citizen Access', 'Industrial Mutation Registry'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Rapidly modernizing peri-urban panchayat connected via Telangana Fiber grid.',
  },
  {
    id: 'gp-mori',
    name: 'Mori Smart Digital Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Smart Village Node',
    stateOrZone: 'Andhra Pradesh',
    district: 'East Godavari',
    complianceRate: 97,
    lat: 16.4833,
    lon: 81.8833,
    services: ['Fiber-to-the-Home (FTTH)', 'Digital Cashew Auction', 'LED Streetlight Sensors'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Godavari delta smart village transformed by UC Berkeley Open Innovation program with 100% digital literacy.',
  },
  {
    id: 'gp-chhapar',
    name: 'Chhapar Women Empowerment GP',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Haryana',
    district: 'Jind District',
    complianceRate: 95,
    lat: 29.3167,
    lon: 76.3167,
    services: ['Beti Bachao Village Registry', 'Digital Panchayat Bhavan', 'CCTV Village Security'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Progressive Jat belt village that abolished the veil (ghoonghat) and celebrates the birth of every girl child.',
  },
  {
    id: 'gp-baghuwar',
    name: 'Baghuwar 100% Clean Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    stateOrZone: 'Madhya Pradesh',
    district: 'Narsinghpur',
    complianceRate: 96,
    lat: 22.95,
    lon: 79.2,
    services: ['Biogas Plant Telemetry', 'Zero-Litigation Gram Sabha', 'Underground Drainage'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Central India model village with no police complaints filed since 1947, 100% functional toilets, and solar streetlights.',
  },
  {
    id: 'gp-dharnai',
    name: 'Dharnai Solar Microgrid Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat Node',
    stateOrZone: 'Bihar',
    district: 'Jehanabad',
    complianceRate: 93,
    lat: 25.2167,
    lon: 84.9833,
    services: ['Solar Microgrid Telemetry', 'Biomass Energy Desk', 'Agricultural Pump Sync'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Bihar’s first 100% solar powered village operating a 100kW clean microgrid supplying power to homes and shops.',
  },
  {
    id: 'gp-piplantri',
    name: 'Piplantri Eco-Feminist Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Eco Panchayat',
    stateOrZone: 'Rajasthan',
    district: 'Rajsamand',
    complianceRate: 96,
    lat: 25.0833,
    lon: 73.8833,
    services: ['111 Trees per Girl Child Fund', 'Marble Slurry Reclamation', 'Aloe Vera Cooperative'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'World-famous eco-feminist village planting 111 fruit trees for every girl born, planting over 400,000 trees to date.',
  },
  {
    id: 'gp-khonoma',
    name: 'Khonoma Green Village Council',
    category: 'gram_panchayat',
    categoryLabel: 'Traditional Village Council',
    stateOrZone: 'Nagaland',
    district: 'Kohima District',
    complianceRate: 94,
    lat: 25.65,
    lon: 94.0167,
    services: ['Community Sanctuary Telemetry', 'Alder Agroforestry Registry', 'Blyth Tragopan Protection'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Asia’s first green village council having banned all wildlife hunting and timber logging in the Angami Naga hills.',
  },
  {
    id: 'gp-mawlynnong',
    name: 'Mawlynnong Cleanest Village Council',
    category: 'gram_panchayat',
    categoryLabel: 'Traditional Village Council',
    stateOrZone: 'Meghalaya',
    district: 'East Khasi Hills',
    complianceRate: 96,
    lat: 25.2,
    lon: 91.9167,
    services: ['Living Root Bridge Conservation', '100% Bamboo Waste Recycling', 'Eco-Tourism Permit Desk'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
    description: 'Acclaimed as "God’s Own Garden" and cleanest village in Asia with 100% functional sanitation and rainwater recycling.',
  },

  // ─── 3. MUNICIPAL CORPORATIONS & LOCAL BODIES ───────
  {
    id: 'mc-mangaluru',
    name: 'Mangaluru City Corporation (MCC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation HQ',
    stateOrZone: 'Karnataka',
    district: 'Dakshina Kannada',
    complianceRate: 91,
    lat: 12.8703,
    lon: 74.8427,
    services: ['Property Tax Online (SAS)', 'Trade License', 'Birth/Death Records', 'Water Billing'],
    colorHex: 'rgba(56, 189, 248, 0.95)', // Sky Blue
    color: 0x38bdf8,
    portalUrl: 'https://mangalurucity.mrc.gov.in',
    description: 'Premier coastal civic body serving Mangaluru port city and regional industrial corridors.',
  },
  {
    id: 'cmc-udupi',
    name: 'Udupi City Municipal Council',
    category: 'municipal',
    categoryLabel: 'City Municipal Council',
    stateOrZone: 'Karnataka',
    district: 'Udupi District',
    complianceRate: 89,
    lat: 13.3409,
    lon: 74.7421,
    services: ['e-Swathu Portal', 'Khata Transfer', 'Building Approvals', 'Solid Waste Portal'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://udupicity.mrc.gov.in',
    description: 'Cultural and educational hub municipal body providing bilingual civic citizen certificates.',
  },
  {
    id: 'mc-bbmp',
    name: 'BBMP Bengaluru Municipal Gateway',
    category: 'municipal',
    categoryLabel: 'Metropolitan Corporation',
    stateOrZone: 'Karnataka',
    district: 'Bengaluru Urban',
    complianceRate: 92,
    lat: 12.9716,
    lon: 77.5946,
    services: ['SAS Property Tax', 'Trade License 24x7', 'E-Aasthi Portal', 'Namma Bengaluru App'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://bbmp.gov.in',
    description: 'Apex civic agency overseeing municipal infrastructure for 1.3+ crore citizens across 198 wards.',
  },
  {
    id: 'mc-mysuru',
    name: 'Mysuru City Corporation',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Karnataka',
    district: 'Mysuru District',
    complianceRate: 93,
    lat: 12.3051,
    lon: 76.6554,
    services: ['MCC Civic Portal', 'Heritage Zone Approvals', 'Online Water Bill', 'Trade License'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://mysurucitycorporation.co.in',
    description: 'Heritage city municipal body integrating accessible heritage walking zones and citizen services.',
  },
  {
    id: 'mc-hdmc',
    name: 'Hubballi-Dharwad Municipal Corp (HDMC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Karnataka',
    district: 'Dharwad District',
    complianceRate: 90,
    lat: 15.3647,
    lon: 75.124,
    services: ['e-Governance Seva', 'Property Tax', 'Birth/Death Records', 'Water Supply'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://hdmc.mrc.gov.in',
    description: 'Second largest municipal corporation in Karnataka managing twin commercial smart cities.',
  },
  {
    id: 'mc-belagavi',
    name: 'Belagavi City Corporation',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Karnataka',
    district: 'Belagavi District',
    complianceRate: 88,
    lat: 15.8497,
    lon: 74.4977,
    services: ['Bilingual Citizen Portal', 'Property Tax', 'Trade License'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    description: 'Northern Karnataka civic administration with multi-lingual Kannada and Marathi accessibility.',
  },
  {
    id: 'mc-shivamogga',
    name: 'Shivamogga City Corporation',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Karnataka',
    district: 'Shivamogga District',
    complianceRate: 89,
    lat: 13.9299,
    lon: 75.5681,
    services: ['Smart City Portal', 'Property Tax e-Payment', 'Public Complaints'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    description: 'Gateway to Malenadu managing urban civic amenities and green smart city developments.',
  },
  {
    id: 'mc-kalaburagi',
    name: 'Kalaburagi City Corporation',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Karnataka',
    district: 'Kalaburagi District',
    complianceRate: 84,
    lat: 17.3297,
    lon: 76.8343,
    services: ['Kalyana Karnataka Portal', 'Property Tax', 'Citizen Seva Kendra'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    description: 'Civic headquarters of the Kalyana-Karnataka region with citizen grievance redressing.',
  },
  {
    id: 'tmc-bantwal',
    name: 'Bantwal Town Municipal Council',
    category: 'municipal',
    categoryLabel: 'Town Municipality',
    stateOrZone: 'Karnataka',
    district: 'Dakshina Kannada',
    complianceRate: 86,
    lat: 12.8943,
    lon: 75.0345,
    services: ['Trade License Renewal', 'Property Tax', 'Civic Complaints'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    description: 'Key municipality situated on Netravati river basin providing local trade registries.',
  },
  {
    id: 'cmc-puttur',
    name: 'Puttur City Municipal Council',
    category: 'municipal',
    categoryLabel: 'City Municipal Council',
    stateOrZone: 'Karnataka',
    district: 'Dakshina Kannada',
    complianceRate: 88,
    lat: 12.7661,
    lon: 75.2014,
    services: ['e-Aasthi Property Portal', 'Water Meter Billing', 'Public Grievance'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    description: 'Commercial trading center municipality in southern Dakshina Kannada.',
  },
  {
    id: 'tmc-kundapura',
    name: 'Kundapura Town Municipal Council',
    category: 'municipal',
    categoryLabel: 'Town Municipality',
    stateOrZone: 'Karnataka',
    district: 'Udupi District',
    complianceRate: 87,
    lat: 13.6272,
    lon: 74.6936,
    services: ['Coastal Zone Clearances', 'Property Tax', 'Citizen Certifications'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    description: 'Coastal municipality overseeing fisheries licenses and water front civic works.',
  },
  {
    id: 'mc-bmc',
    name: 'Brihanmumbai Municipal Corporation (BMC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Maharashtra',
    district: 'Mumbai',
    complianceRate: 95,
    lat: 18.9403,
    lon: 72.8354,
    services: ['e-Municipal Services', 'Property Tax', 'Disaster Control Telemetry', 'Auto DCR'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://portal.mcgm.gov.in',
    description: 'Richest municipal corporation in India delivering mission-critical civic services for Mumbai.',
  },
  {
    id: 'mc-gcc',
    name: 'Greater Chennai Corporation (GCC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Tamil Nadu',
    district: 'Chennai',
    complianceRate: 93,
    lat: 13.0827,
    lon: 80.2707,
    services: ['Namma Chennai Citizen App', 'Property Tax', 'Birth/Death Certificates', 'Grievance 1913'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://chennaicorporation.gov.in',
    description: 'Oldest municipal institution in India outside the UK, founded 1688, based at Ripon Building.',
  },
  {
    id: 'mc-ndmc',
    name: 'New Delhi Municipal Council (NDMC)',
    category: 'municipal',
    categoryLabel: 'Municipal Council',
    stateOrZone: 'Delhi (NCT)',
    district: 'New Delhi',
    complianceRate: 97,
    lat: 28.5983,
    lon: 77.2181,
    services: ['NDMC 311 Citizen App', 'Property Tax', 'Electricity & Water e-Bill', 'Estate Licences'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://ndmc.gov.in',
    description: 'Premier national capital municipal administration managing Lutyens Delhi and diplomatic quarters.',
  },
  {
    id: 'mc-pmc',
    name: 'Pune Municipal Corporation (PMC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Maharashtra',
    district: 'Pune',
    complianceRate: 94,
    lat: 18.5204,
    lon: 73.8567,
    services: ['PMC Care 24x7', 'Property Tax Rebates', 'Tree Census Portal', 'Water Metering'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://pmc.gov.in',
    description: 'High-performing IT city civic agency providing automated citizen redressal and tree telemetry.',
  },
  {
    id: 'mc-kmc',
    name: 'Kolkata Municipal Corporation (KMC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'West Bengal',
    district: 'Kolkata',
    complianceRate: 89,
    lat: 22.5626,
    lon: 88.3512,
    services: ['KMC Citizen Portal', 'Assessment & Collection', 'License Department', 'Water Supply'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://kmcgov.in',
    description: 'Apex municipal authority for the Kolkata urban agglomeration with digitized tax collections.',
  },
  {
    id: 'mc-ghmc',
    name: 'Greater Hyderabad Municipal Corp (GHMC)',
    category: 'municipal',
    categoryLabel: 'Municipal Corporation',
    stateOrZone: 'Telangana',
    district: 'Hyderabad',
    complianceRate: 92,
    lat: 17.385,
    lon: 78.4867,
    services: ['MyGHMC App', 'Trade License Online', 'Property Tax e-Seva', 'Town Planning Approvals'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
    portalUrl: 'https://ghmc.gov.in',
    description: 'Metropolitan civic body for Hyderabad tech cluster with paperless building permits.',
  },

  // ─── 4. CENTRAL GOVERNMENT MINISTRIES & ESSENTIAL CITIZEN PORTALS ─
  {
    id: 'gov-india',
    name: 'National Portal of India',
    category: 'central_govt',
    categoryLabel: 'Central Govt Gateway',
    stateOrZone: 'Govt of India (NIC)',
    district: 'New Delhi',
    complianceRate: 98,
    lat: 28.6139,
    lon: 77.209,
    services: ['Single-Window Citizen Access', 'GIGW 3.0 Standard Baseline', 'National Services Directory'],
    colorHex: 'rgba(16, 185, 129, 0.95)', // Emerald
    color: 0x10b981,
    portalUrl: 'https://india.gov.in',
    description: 'Official single-window portal providing unified access to all central and state government services.',
  },
  {
    id: 'gov-digitalindia',
    name: 'Digital India Core Services (MeitY)',
    category: 'central_govt',
    categoryLabel: 'MeitY Initiative',
    stateOrZone: 'Ministry of Electronics & IT',
    district: 'New Delhi',
    complianceRate: 96,
    lat: 28.591,
    lon: 77.228,
    services: ['Digital Locker', 'UMANG Integration', 'MeriPehchan Single Sign-On', 'OpenForge'],
    colorHex: 'rgba(16, 185, 129, 0.95)',
    color: 0x10b981,
    portalUrl: 'https://digitalindia.gov.in',
    description: 'Flagship programme transforming India into a digitally empowered society and knowledge economy.',
  },
  {
    id: 'gov-uidai',
    name: 'UIDAI Aadhaar Identity Portal',
    category: 'central_govt',
    categoryLabel: 'National Identity Platform',
    stateOrZone: 'Govt of India',
    district: 'New Delhi HQ',
    complianceRate: 97,
    lat: 28.6289,
    lon: 77.2065,
    services: ['MyAadhaar Portal', 'Biometric Lock/Unlock', 'e-Aadhaar Download', 'Address Update'],
    colorHex: 'rgba(16, 185, 129, 0.95)',
    color: 0x10b981,
    portalUrl: 'https://uidai.gov.in',
    description: 'Worlds largest digital identity platform verifying 140+ crore Indian residents securely.',
  },
  {
    id: 'gov-parivahan',
    name: 'Parivahan Sewa (MoRTH)',
    category: 'central_govt',
    categoryLabel: 'Transport & Highway Portal',
    stateOrZone: 'Ministry of Road Transport',
    district: 'New Delhi',
    complianceRate: 94,
    lat: 28.618,
    lon: 77.212,
    services: ['Driving Licence Portal (SARATHI)', 'Vehicle Registration (VAHAN)', 'E-Challan Telemetry'],
    colorHex: 'rgba(16, 185, 129, 0.95)',
    color: 0x10b981,
    portalUrl: 'https://parivahan.gov.in',
    description: 'Unified national pan-India registry for 35+ crore vehicles and driving licences.',
  },
  {
    id: 'gov-incometax',
    name: 'Income Tax e-Filing Portal',
    category: 'central_govt',
    categoryLabel: 'Revenue & Finance Platform',
    stateOrZone: 'Ministry of Finance',
    district: 'New Delhi',
    complianceRate: 96,
    lat: 28.625,
    lon: 77.217,
    services: ['ITR Filing 24x7', 'Instant PAN (e-PAN)', 'AIS/TIS Annual Tax Statements', 'Refund Tracker'],
    colorHex: 'rgba(16, 185, 129, 0.95)',
    color: 0x10b981,
    portalUrl: 'https://incometax.gov.in',
    description: 'National direct taxation and e-filing system handling 7.5+ crore annual citizen returns.',
  },
  {
    id: 'gov-digilocker',
    name: 'DigiLocker Citizen Document Cloud',
    category: 'central_govt',
    categoryLabel: 'Digital Document Cloud',
    stateOrZone: 'MeitY India',
    district: 'New Delhi',
    complianceRate: 97,
    lat: 28.588,
    lon: 77.223,
    services: ['Legally Valid e-Documents', 'Academic Degree Vault', 'Driving License & RC Sync'],
    colorHex: 'rgba(16, 185, 129, 0.95)',
    color: 0x10b981,
    portalUrl: 'https://digilocker.gov.in',
    description: 'Paperless digital wallet storing 600+ crore verified certificates legally equal to physical originals.',
  },

  // ─── 5. STATE GOVERNMENT PORTALS ────────────────────
  {
    id: 'state-karnataka',
    name: 'Karnataka State Portal & Seva Sindhu',
    category: 'state_govt',
    categoryLabel: 'State Citizen Gateway',
    stateOrZone: 'Karnataka',
    district: 'Vidhana Soudha, Bengaluru',
    complianceRate: 95,
    lat: 12.9791,
    lon: 77.5913,
    services: ['Seva Sindhu 800+ Services', 'Kutumba Social Security', 'Bhoomi RTC Land Records', 'Gruha Lakshmi'],
    colorHex: 'rgba(129, 140, 248, 0.95)', // Indigo
    color: 0x818cf8,
    portalUrl: 'https://karnataka.gov.in',
    description: 'Central unified single-window portal delivering 800+ government services to Karnataka citizens.',
  },
  {
    id: 'state-maharashtra',
    name: 'Aaple Sarkar Maharashtra Portal',
    category: 'state_govt',
    categoryLabel: 'State Citizen Gateway',
    stateOrZone: 'Maharashtra',
    district: 'Mantralaya, Mumbai',
    complianceRate: 94,
    lat: 18.928,
    lon: 72.832,
    services: ['Right to Public Services (RTS)', 'Mahabhulekh Land Records', 'Revenue Certificates'],
    colorHex: 'rgba(129, 140, 248, 0.95)',
    color: 0x818cf8,
    portalUrl: 'https://aaplesarkar.mahaonline.gov.in',
    description: 'Time-bound citizen service guarantee portal delivering 500+ statutory certificates online.',
  },
  {
    id: 'state-tamilnadu',
    name: 'Tamil Nadu e-Sevai Gateway',
    category: 'state_govt',
    categoryLabel: 'State Citizen Gateway',
    stateOrZone: 'Tamil Nadu',
    district: 'Fort St. George, Chennai',
    complianceRate: 93,
    lat: 13.06,
    lon: 80.25,
    services: ['Patta/Chitta Land Records', 'Community & Nativity e-Certificates', 'TNeGA Cloud'],
    colorHex: 'rgba(129, 140, 248, 0.95)',
    color: 0x818cf8,
    portalUrl: 'https://tnesevai.tn.gov.in',
    description: 'Digital transformation engine of Tamil Nadu integrating all grassroots district collectorates.',
  },
  {
    id: 'state-kerala',
    name: 'e-District Kerala Services',
    category: 'state_govt',
    categoryLabel: 'State Citizen Gateway',
    stateOrZone: 'Kerala',
    district: 'Thiruvananthapuram',
    complianceRate: 96,
    lat: 8.5241,
    lon: 76.9366,
    services: ['24x7 Revenue Certificates', 'Akshaya e-Centre Integration', 'Welfare Pensions'],
    colorHex: 'rgba(129, 140, 248, 0.95)',
    color: 0x818cf8,
    portalUrl: 'https://edistrict.kerala.gov.in',
    description: '100% digitized district revenue and welfare delivery system integrated with Akshaya citizen kiosks.',
  },
];

/**
 * Converts hex, rgb, or rgba string to rgba with explicit opacity.
 */
function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('#')) {
    const c = hex.slice(1);
    const num = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\d\.]+\)$/, `${alpha})`);
  }
  if (hex.startsWith('rgb')) {
    return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  return `rgba(56, 189, 248, ${alpha})`;
}

/**
 * 1. Tight Volumetric Chroma Halo Texture (128x128)
 * Creates a focused, soft rim light in the node's category color.
 */
function createChromaAuraTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const cx = 64;
  const cy = 64;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
  grad.addColorStop(0.0, hexToRgba(colorHex, 0.75));
  grad.addColorStop(0.4, hexToRgba(colorHex, 0.35));
  grad.addColorStop(0.8, hexToRgba(colorHex, 0.08));
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * 2. Precision Laser-Sharp Anamorphic Diamond Flare Texture (128x128)
 * Features slender colored diffraction needles, delicate lens ring,
 * and a pinpoint highlight core that preserves category identity.
 */
function createSharpPointerFlareTexture(tintHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const cx = 64;
  const cy = 64;

  // 1. Sleek Core Tint (No giant white blob!)
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
  coreGrad.addColorStop(0.0, '#ffffff');
  coreGrad.addColorStop(0.25, hexToRgba(tintHex, 0.9));
  coreGrad.addColorStop(0.7, hexToRgba(tintHex, 0.4));
  coreGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Slender Anamorphic Diffraction Needles in category color
  const drawSpike = (angle: number, length: number, baseW: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -length);
    grad.addColorStop(0.0, '#ffffff');
    grad.addColorStop(0.2, tintHex);
    grad.addColorStop(0.65, hexToRgba(tintHex, 0.35));
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -length); // Needle tip
    ctx.lineTo(baseW, -4);
    ctx.lineTo(baseW * 0.4, 0);
    ctx.lineTo(0, baseW * 0.15);
    ctx.lineTo(-baseW * 0.4, 0);
    ctx.lineTo(-baseW, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // 4 Primary Cardinal Spikes (Slender 48px rays)
  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((angle) => {
    drawSpike(angle, 48, 1.4);
  });

  // 4 Delicate Diagonal Shimmer Rays (24px)
  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((angle) => {
    drawSpike(angle, 24, 0.9);
  });

  // 3. Crisp Concentric Lens Ring
  ctx.save();
  ctx.strokeStyle = hexToRgba(tintHex, 0.45);
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4. Pinpoint Highlight Bead
  const beadGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 2.5);
  beadGrad.addColorStop(0.0, '#ffffff');
  beadGrad.addColorStop(0.7, '#ffffff');
  beadGrad.addColorStop(1.0, hexToRgba(tintHex, 0.6));
  ctx.fillStyle = beadGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * 3. Ground Location Target Reticle Texture (128x128)
 * High-tech GPS targeting sight painted directly onto the terrain surface at (lat, lon):
 * Outer targeting circle with 4 crosshair tick marks, inner focal ring, and center contact point.
 */
function createGroundTargetTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const cx = 64;
  const cy = 64;

  ctx.save();

  // Outer Reticle Ring
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.stroke();

  // 4 Cardinal Crosshair Tick Marks
  const tickLen = 9;
  ctx.lineWidth = 2.0;
  // Top
  ctx.beginPath();
  ctx.moveTo(cx, cy - 52 - tickLen);
  ctx.lineTo(cx, cy - 52 + 4);
  ctx.stroke();
  // Bottom
  ctx.beginPath();
  ctx.moveTo(cx, cy + 52 - 4);
  ctx.lineTo(cx, cy + 52 + tickLen);
  ctx.stroke();
  // Left
  ctx.beginPath();
  ctx.moveTo(cx - 52 - tickLen, cy);
  ctx.lineTo(cx - 52 + 4, cy);
  ctx.stroke();
  // Right
  ctx.beginPath();
  ctx.moveTo(cx + 52 - 4, cy);
  ctx.lineTo(cx + 52 + tickLen, cy);
  ctx.stroke();

  // Inner Concentric Ring
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.stroke();

  // Center Ground Contact Point
  const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  dotGrad.addColorStop(0.0, '#ffffff');
  dotGrad.addColorStop(0.5, colorHex);
  dotGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = dotGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

interface NodeVisualItem {
  data: IndiaGovNode;
  pos: THREE.Vector3;
  groundPos: THREE.Vector3;
  reticleMesh: THREE.Mesh;
  reticleMat: THREE.MeshBasicMaterial;
  needleMesh: THREE.Mesh;
  needleMat: THREE.MeshBasicMaterial;
  headBeadMesh: THREE.Mesh;
  headBeadMat: THREE.MeshBasicMaterial;
  dotMesh: THREE.Mesh;
  dotMat: THREE.MeshBasicMaterial;
  hitMesh: THREE.Mesh;
  shineSprite: THREE.Sprite;
  shineMat: THREE.SpriteMaterial;
  auraSprite: THREE.Sprite;
  auraMat: THREE.SpriteMaterial;
}

interface IndiaTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IndiaTelemetryModal: React.FC<IndiaTelemetryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const visualItemsRef = useRef<NodeVisualItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<IndiaGovNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<IndiaGovNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanchayatDirOpen, setIsPanchayatDirOpen] = useState<boolean>(false);
  const [dirSearchQuery, setDirSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'vector' | 'globe'>('vector');
  const [activePreset, setActivePreset] = useState<'center' | 'karnataka' | 'delhi' | 'mumbai' | 'east' | null>(null);

  // Camera controls refs
  const resetViewRef = useRef<() => void>(() => {});
  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});
  const flyToNodeRef = useRef<(lat: number, lon: number) => void>(() => {});
  const flyToPresetRef = useRef<(region: 'karnataka' | 'delhi' | 'mumbai' | 'center') => void>(() => {});

  const handleSelectPreset = (preset: 'center' | 'karnataka' | 'delhi' | 'mumbai' | 'east') => {
    setActivePreset(preset);
    if (viewMode === 'globe') {
      if (preset === 'east') {
        flyToNodeRef.current(26.1445, 91.7362);
      } else {
        flyToPresetRef.current(preset);
      }
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPanchayatDirOpen) {
          setIsPanchayatDirOpen(false);
          return;
        }
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isPanchayatDirOpen]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return ALL_INDIA_GOV_NODES.filter((node) => {
      const matchCat =
        selectedCategory === 'all' || node.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.stateOrZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.district && node.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
        node.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Filtered State Panchayat Directory (2,55,248 Panchayats)
  const filteredDirectory = useMemo(() => {
    if (!dirSearchQuery.trim()) return NATIONAL_PANCHAYAT_DIRECTORY;
    const q = dirSearchQuery.toLowerCase();
    return NATIONAL_PANCHAYAT_DIRECTORY.filter(
      (item) =>
        item.state.toLowerCase().includes(q) ||
        item.portalName.toLowerCase().includes(q) ||
        item.services.some((s) => s.toLowerCase().includes(q))
    );
  }, [dirSearchQuery]);

  // Synchronize 3D pin visibility with category filter and search query
  useEffect(() => {
    const activeIds = new Set(filteredNodes.map((n) => n.id));
    visualItemsRef.current.forEach((item) => {
      const isVisible = activeIds.has(item.data.id);
      item.dotMesh.visible = isVisible;
      item.hitMesh.visible = isVisible;
      item.reticleMesh.visible = isVisible;
      item.needleMesh.visible = isVisible;
      item.headBeadMesh.visible = isVisible;
      item.auraSprite.visible = isVisible;
      item.shineSprite.visible = isVisible;
    });
  }, [filteredNodes]);

  // Three.js Fullscreen India Globe Engine
  useEffect(() => {
    if (!isOpen || viewMode !== 'globe') return;
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Positioned and zoomed right on India
    camera.position.z = 130;
    let targetCameraZ = 130;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = 0.35;
    globeGroup.rotation.y = -3.20;
    globeGroup.rotation.x = 0.30;
    scene.add(globeGroup);

    const disposables: { dispose: () => void }[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    // Textures
    const sphereRadius = 65;
    const textureLoader = new THREE.TextureLoader();
    const earthDayMap = textureLoader.load('/textures/earth_atmos_2048.jpg');
    earthDayMap.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const earthNormalMap = textureLoader.load('/textures/earth_normal_2048.jpg');
    const earthSpecularMap = textureLoader.load('/textures/earth_specular_2048.jpg');
    const earthLightsMap = textureLoader.load('/textures/earth_lights_2048.png');
    const earthCloudsMap = textureLoader.load('/textures/earth_clouds_1024.png');
    disposables.push(earthDayMap, earthNormalMap, earthSpecularMap, earthLightsMap, earthCloudsMap);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthDayMap,
      normalMap: earthNormalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      specularMap: earthSpecularMap,
      specular: new THREE.Color(0x283848),
      shininess: 24,
      emissiveMap: earthLightsMap,
      emissive: new THREE.Color(0xd49b4b),
      emissiveIntensity: 0.6,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);
    disposables.push(earthGeo, earthMat);

    // Clouds
    const cloudGeo = new THREE.SphereGeometry(sphereRadius * 1.006, 64, 64);
    const cloudMat = new THREE.MeshLambertMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);
    disposables.push(cloudGeo, cloudMat);

    // Sun & Ambient Light (Fine-tuned for vivid neon contrast on terrain)
    const sunLight = new THREE.DirectionalLight(0xfffcf2, 1.85);
    sunLight.position.set(120, 75, 130);
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.85);
    scene.add(ambientLight);

    // High-Resolution Precision Texture Maps per Category
    const reticleTexMap: Record<string, THREE.CanvasTexture> = {
      railway: createGroundTargetTexture('#00f5ff'),
      gram_panchayat: createGroundTargetTexture('#ffb703'),
      municipal: createGroundTargetTexture('#38bdf8'),
      central_govt: createGroundTargetTexture('#10b981'),
      state_govt: createGroundTargetTexture('#c084fc'),
    };
    const flareTexMap: Record<string, THREE.CanvasTexture> = {
      railway: createSharpPointerFlareTexture('#00f5ff'),
      gram_panchayat: createSharpPointerFlareTexture('#ffb703'),
      municipal: createSharpPointerFlareTexture('#38bdf8'),
      central_govt: createSharpPointerFlareTexture('#10b981'),
      state_govt: createSharpPointerFlareTexture('#c084fc'),
    };
    const auraTexMap: Record<string, THREE.CanvasTexture> = {
      railway: createChromaAuraTexture('#00f5ff'),
      gram_panchayat: createChromaAuraTexture('#ffb703'),
      municipal: createChromaAuraTexture('#38bdf8'),
      central_govt: createChromaAuraTexture('#10b981'),
      state_govt: createChromaAuraTexture('#c084fc'),
    };
    Object.values(reticleTexMap).forEach((t) => disposables.push(t));
    Object.values(flareTexMap).forEach((t) => disposables.push(t));
    Object.values(auraTexMap).forEach((t) => disposables.push(t));

    const visualItems: NodeVisualItem[] = [];

    ALL_INDIA_GOV_NODES.forEach((node) => {
      const phi = (90 - node.lat) * (Math.PI / 180);
      const theta = (node.lon + 180) * (Math.PI / 180);

      // Normal unit vector from sphere center pointing outward at (lat, lon)
      const nx = -(Math.sin(phi) * Math.cos(theta));
      const nz = Math.sin(phi) * Math.sin(theta);
      const ny = Math.cos(phi);
      const normal = new THREE.Vector3(nx, ny, nz).normalize();

      // 1. Precise Ground Contact Point on terrain surface
      const rGround = sphereRadius * 1.0015;
      const groundPos = normal.clone().multiplyScalar(rGround);

      // 2. Elevated Marker Head Position (height = 1.0 units)
      const pinHeight = 1.0;
      const rHead = rGround + pinHeight;
      const elevatedPos = normal.clone().multiplyScalar(rHead);

      // 3. Midpoint of the needle
      const midPos = normal.clone().multiplyScalar(rGround + pinHeight / 2);

      // A. Ground Targeting Reticle Disc (Snug, crisp GPS targeting sight)
      const reticleGeo = new THREE.PlaneGeometry(0.48, 0.48);
      const reticleTex = reticleTexMap[node.category] || reticleTexMap.central_govt;
      const reticleMat = new THREE.MeshBasicMaterial({
        map: reticleTex,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
      reticleMesh.position.copy(groundPos);
      reticleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      globeGroup.add(reticleMesh);
      disposables.push(reticleGeo, reticleMat);

      // B. Ground Contact Pinpoint Bead in category color
      const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: node.color });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(groundPos);
      globeGroup.add(dotMesh);
      disposables.push(dotGeo, dotMat);

      // C. Razor-Sharp 3D Tapered Stiletto Needle (Points directly down to groundPos)
      const needleGeo = new THREE.CylinderGeometry(0.024, 0.005, pinHeight, 8);
      const needleMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.85,
        depthWrite: true,
      });
      const needleMesh = new THREE.Mesh(needleGeo, needleMat);
      needleMesh.position.copy(midPos);
      needleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      globeGroup.add(needleMesh);
      disposables.push(needleGeo, needleMat);

      // D. Elevated Marker Head Core (Crisp Jewel Pinhead in Category Color)
      const headBeadGeo = new THREE.SphereGeometry(0.10, 12, 12);
      const headBeadMat = new THREE.MeshBasicMaterial({ color: node.color });
      const headBeadMesh = new THREE.Mesh(headBeadGeo, headBeadMat);
      headBeadMesh.position.copy(elevatedPos);
      globeGroup.add(headBeadMesh);
      disposables.push(headBeadGeo, headBeadMat);

      // Specular highlight micro-dot inside the jewel head
      const headDotGeo = new THREE.SphereGeometry(0.035, 6, 6);
      const headDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const headDotMesh = new THREE.Mesh(headDotGeo, headDotMat);
      headDotMesh.position.copy(elevatedPos);
      globeGroup.add(headDotMesh);
      disposables.push(headDotGeo, headDotMat);

      // E. Sharp Pointer Diamond Flare Sprite (Subtle resting micro-twinkle)
      const flareTex = flareTexMap[node.category] || flareTexMap.central_govt;
      const shineMat = new THREE.SpriteMaterial({
        map: flareTex,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const shineSprite = new THREE.Sprite(shineMat);
      shineSprite.position.copy(elevatedPos);
      shineSprite.scale.set(0.30, 0.30, 1);
      globeGroup.add(shineSprite);
      disposables.push(shineMat);

      // F. Tight Chroma Halo Sprite (Subtle color glow hugging the head bead)
      const auraTex = auraTexMap[node.category] || auraTexMap.central_govt;
      const auraMat = new THREE.SpriteMaterial({
        map: auraTex,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const auraSprite = new THREE.Sprite(auraMat);
      auraSprite.position.copy(elevatedPos);
      auraSprite.scale.set(0.24, 0.24, 1);
      globeGroup.add(auraSprite);
      disposables.push(auraMat);

      // G. Hit Collider (Generous for effortless raycasting)
      const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(elevatedPos);
      hitMesh.userData = { govData: node };
      globeGroup.add(hitMesh);
      interactiveMeshes.push(hitMesh);
      disposables.push(hitGeo, hitMat);

      visualItems.push({
        data: node,
        pos: elevatedPos,
        groundPos,
        reticleMesh,
        reticleMat,
        needleMesh,
        needleMat,
        headBeadMesh,
        headBeadMat,
        dotMesh,
        dotMat,
        hitMesh,
        shineSprite,
        shineMat,
        auraSprite,
        auraMat,
      });
    });

    visualItemsRef.current = visualItems;

    // Subcontinent Interconnection Telemetry Arcs (Golden / Cyan data links)
    const arcConnections = [
      [0, 1], [0, 2], [0, 3], [0, 4], [2, 5], [0, 32], [7, 8], [7, 15], [15, 16],
      [17, 18], [26, 27], [32, 33], [32, 34], [32, 35], [38, 39],
    ];

    const arcLines: THREE.Line[] = [];
    arcConnections.forEach(([fromIdx, toIdx]) => {
      if (visualItems[fromIdx] && visualItems[toIdx]) {
        const from = visualItems[fromIdx].pos;
        const to = visualItems[toIdx].pos;
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(sphereRadius * 1.08);
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const pts = curve.getPoints(30);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
        });
        const line = new THREE.Line(geo, mat);
        globeGroup.add(line);
        arcLines.push(line);
        disposables.push(geo, mat);
      }
    });

    // Camera & Controls (Facing India dead-center)
    let targetRotationY = -3.20;
    let targetRotationX = 0.30;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let velocityY = 0;

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      velocityY = 0;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        let frontHit: THREE.Mesh | null = null;
        for (const hitObj of intersects) {
          const m = hitObj.object as THREE.Mesh;
          const worldPos = m.position.clone().applyMatrix4(globeGroup.matrixWorld);
          const normalVec = worldPos.clone().normalize();
          const camDir = camera.position.clone().sub(worldPos).normalize();
          if (normalVec.dot(camDir) > 0.05) {
            frontHit = m;
            break;
          }
        }

        if (frontHit && frontHit.userData?.govData) {
          const nodeData = frontHit.userData.govData as IndiaGovNode;
          const worldPos = frontHit.position.clone().applyMatrix4(globeGroup.matrixWorld);
          const screenPos = worldPos.project(camera);
          const x = ((screenPos.x + 1) * rect.width) / 2;
          const y = ((-screenPos.y + 1) * rect.height) / 2;

          setHoveredNode(nodeData);
          setTooltipPos({ x, y });
        } else {
          setHoveredNode(null);
        }
      } else {
        setHoveredNode(null);
      }

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        targetRotationY += dx * 0.005;
        targetRotationX += dy * 0.004;
        velocityY = dx * 0.005;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        for (const hitObj of intersects) {
          const m = hitObj.object as THREE.Mesh;
          const worldPos = m.position.clone().applyMatrix4(globeGroup.matrixWorld);
          const normalVec = worldPos.clone().normalize();
          const camDir = camera.position.clone().sub(worldPos).normalize();
          if (normalVec.dot(camDir) > 0.05 && m.userData?.govData) {
            setSelectedNode(m.userData.govData);
            break;
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCameraZ = THREE.MathUtils.clamp(targetCameraZ + e.deltaY * 0.14, 100, 220);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('click', onClick);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Camera control refs
    resetViewRef.current = () => {
      targetRotationY = -3.20;
      targetRotationX = 0.30;
      targetCameraZ = 130;
    };
    zoomInRef.current = () => {
      targetCameraZ = Math.max(90, targetCameraZ - 20);
    };
    zoomOutRef.current = () => {
      targetCameraZ = Math.min(220, targetCameraZ + 20);
    };
    flyToNodeRef.current = (lat: number, lon: number) => {
      // Calibrated offset from India center (lat 21.0, lon 78.5)
      targetRotationY = -3.20 - (lon - 78.5) * (Math.PI / 180) * 1.6;
      targetRotationX = 0.30 - (lat - 21.0) * (Math.PI / 180) * 0.6;
      targetCameraZ = 95;
    };
    flyToPresetRef.current = (region: 'karnataka' | 'delhi' | 'mumbai' | 'center') => {
      if (region === 'karnataka') {
        targetRotationY = -3.25;
        targetRotationX = 0.36;
        targetCameraZ = 95;
      } else if (region === 'delhi') {
        targetRotationY = -3.19;
        targetRotationX = 0.22;
        targetCameraZ = 95;
      } else if (region === 'mumbai') {
        targetRotationY = -3.27;
        targetRotationX = 0.30;
        targetCameraZ = 95;
      } else {
        targetRotationY = -3.20;
        targetRotationX = 0.30;
        targetCameraZ = 130;
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      camera.position.z += (targetCameraZ - camera.position.z) * 0.09;
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.06;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.06;

      if (!isDragging) {
        velocityY *= 0.95;
        targetRotationY += velocityY;
      }

      cloudMesh.rotation.y = elapsed * 0.002;

      // Animate Needle & Reticle Telemetry (Sharp diamond twinkle and ground target pulse)
      visualItems.forEach((item, i) => {
        const isHovered = hoveredNode?.id === item.data.id;
        const isSelected = selectedNode?.id === item.data.id;

        // 1. Ground Reticle & Jewel Bead Pulse
        if (isHovered || isSelected) {
          item.reticleMesh.scale.set(1.4, 1.4, 1.4);
          item.reticleMat.opacity = 0.95;
          item.needleMat.opacity = 1.0;
          item.headBeadMesh.scale.set(1.35, 1.35, 1.35);

          // Prominent laser-sharp flare ONLY on active/hovered node!
          item.shineSprite.scale.set(0.95, 0.95, 1);
          item.shineMat.opacity = 1.0;
          item.auraSprite.scale.set(0.70, 0.70, 1);
          item.auraMat.opacity = 0.75;
          item.shineMat.rotation = Math.sin(elapsed * 0.5) * 0.15;
        } else {
          // Unhovered resting nodes: calm, distinct, colored pins with NO blinding glare
          item.reticleMesh.scale.set(0.9, 0.9, 0.9);
          item.reticleMat.opacity = 0.45;
          item.needleMat.opacity = 0.8;
          item.headBeadMesh.scale.set(1.0, 1.0, 1.0);

          const microShimmer = Math.sin(elapsed * 2.0 + i * 0.7) * 0.04 + 0.30;
          item.shineSprite.scale.set(microShimmer, microShimmer, 1);
          item.shineMat.opacity = 0.30;
          item.auraSprite.scale.set(0.24, 0.24, 1);
          item.auraMat.opacity = 0.14;
        }
      });

      // Subtle pulse on connection arcs
      arcLines.forEach((arc, i) => {
        ((arc.material as THREE.LineBasicMaterial)).opacity =
          0.2 + Math.sin(elapsed * 1.5 + i * 1.2) * 0.15;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('click', onClick);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      disposables.forEach((d) => d.dispose());
      arcLines.forEach((a) => {
        a.geometry.dispose();
        (a.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [isOpen, viewMode]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* ─── MODAL HEADER & CONTROLS ─── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/90 border-b border-white/10 text-white shadow-xl">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500/20 to-amber-500/20 border border-white/10 text-sky-400">
            {viewMode === 'vector' ? (
              <Map size={22} className="text-sky-400" />
            ) : (
              <Globe size={22} className="animate-spin-slow text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                Bharat Sovereign Accessibility Grid
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                {viewMode === 'vector' ? 'Vector Precision • 0% Blur' : 'Live Telemetry'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'vector'
                ? 'High-Definition Administrative Boundaries • 37 States & UTs • Complete 87 Audited Infrastructure Nodes'
                : 'Complete Geospatial Conformance Map • Railways, Gram Panchayats, Municipal Corporations & Ministries'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Only India Vector (Default) vs 3D Earth Globe */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/15 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('vector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'vector'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Show only India with crisp state borders and zero zoom blur"
          >
            <Map size={14} />
            <span>Only India (Vector Sharp)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('globe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'globe'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Switch to 3D Planetary Orbit Globe"
          >
            <Globe size={14} />
            <span>3D Earth Orbit</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-44 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search portal, panchayat..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <span className="hidden lg:inline-block text-[11px] text-slate-400 font-medium whitespace-nowrap">
            {filteredNodes.length} / {ALL_INDIA_GOV_NODES.length}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Close Explorer (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ─── CATEGORY FILTER PILL STRIP ─── */}
      <div className="relative z-20 flex items-center gap-2 px-6 py-2.5 bg-slate-900/60 border-b border-white/5 overflow-x-auto text-xs text-slate-300 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Grid Filters:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-white text-slate-900 shadow-md font-bold'
              : 'bg-white/10 hover:bg-white/15 text-slate-300'
          }`}
        >
          <Sparkles size={12} className={selectedCategory === 'all' ? 'text-amber-500' : ''} />
          All Offices ({ALL_INDIA_GOV_NODES.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('railway')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'railway'
              ? 'bg-cyan-500 text-white shadow-md font-bold'
              : 'bg-white/10 hover:bg-white/15 text-slate-300'
          }`}
        >
          <Train size={12} className="text-cyan-400" />
          Indian Railways ({ALL_INDIA_GOV_NODES.filter((n) => n.category === 'railway').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('gram_panchayat')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'gram_panchayat'
              ? 'bg-amber-500 text-white shadow-md font-bold'
              : 'bg-white/10 hover:bg-white/15 text-slate-300'
          }`}
        >
          <Trees size={12} className="text-amber-400" />
          Gram Panchayats (2.55L Fed. • {ALL_INDIA_GOV_NODES.filter((n) => n.category === 'gram_panchayat').length} Audited)
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('municipal')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'municipal'
              ? 'bg-sky-500 text-white shadow-md font-bold'
              : 'bg-white/10 hover:bg-white/15 text-slate-300'
          }`}
        >
          <Building2 size={12} className="text-sky-400" />
          Municipal Bodies ({ALL_INDIA_GOV_NODES.filter((n) => n.category === 'municipal').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('central_govt')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'central_govt'
              ? 'bg-emerald-500 text-white shadow-md font-bold'
              : 'bg-white/10 hover:bg-white/15 text-slate-300'
          }`}
        >
          <Landmark size={12} className="text-emerald-400" />
          Central Govt ({ALL_INDIA_GOV_NODES.filter((n) => n.category === 'central_govt').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('state_govt')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'state_govt'
              ? 'bg-indigo-500 text-white shadow-md font-bold'
              : 'bg-white/10 hover:bg-white/15 text-slate-300'
          }`}
        >
          <ShieldCheck size={12} className="text-indigo-400" />
          State Gateways ({ALL_INDIA_GOV_NODES.filter((n) => n.category === 'state_govt').length})
        </button>

        <div className="h-4 w-[1px] bg-white/15 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={() => setIsPanchayatDirOpen(true)}
          className="px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg border border-amber-300/30 whitespace-nowrap ml-auto active:scale-95"
          title="Explore state-by-state directory of all 2,55,248 Gram Panchayats"
        >
          <BookOpen size={12} className="text-amber-100" />
          National 2,55,248 Panchayats Directory
        </button>
      </div>

      {/* ─── MAIN VIEWPORT (VECTOR SHARP BY DEFAULT OR 3D GLOBE) ─── */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {viewMode === 'vector' ? (
          <IndiaVectorMap
            nodes={filteredNodes}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            hoveredNode={hoveredNode}
            onHoverNode={(node, pos) => {
              setHoveredNode(node);
              if (node && pos) {
                setTooltipPos(pos);
              }
            }}
            activePreset={activePreset}
            onResetPreset={() => setActivePreset(null)}
          />
        ) : (
          <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
            <div ref={canvasContainerRef} className="w-full h-full" />

            {/* Floating Camera Controls Toolbar for 3D Globe */}
            <div className="absolute top-4 right-6 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-white/15 shadow-2xl text-white z-30">
              <button
                type="button"
                onClick={() => handleSelectPreset('center')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                title="Reset View to India Center"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Center India</span>
              </button>
              <div className="w-[1px] h-4 bg-white/20 mx-0.5"></div>
              <button
                type="button"
                onClick={() => zoomInRef.current()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                onClick={() => zoomOutRef.current()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Region Focus Shortcuts Strip */}
        <div className="absolute top-4 left-6 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/85 backdrop-blur-xl border border-white/15 shadow-2xl text-xs z-30">
          <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Jump to:</span>
          <button
            type="button"
            onClick={() => handleSelectPreset('karnataka')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 active:scale-95 ${
              activePreset === 'karnataka'
                ? 'bg-amber-500 text-white shadow'
                : 'bg-white/10 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300'
            }`}
          >
            <Trees size={11} className={activePreset === 'karnataka' ? 'text-white' : 'text-amber-400'} />
            Karnataka & Coast
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('delhi')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 active:scale-95 ${
              activePreset === 'delhi'
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-white/10 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300'
            }`}
          >
            <Landmark size={11} className={activePreset === 'delhi' ? 'text-white' : 'text-emerald-400'} />
            Delhi Ministries
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('mumbai')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 active:scale-95 ${
              activePreset === 'mumbai'
                ? 'bg-cyan-500 text-white shadow'
                : 'bg-white/10 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300'
            }`}
          >
            <Train size={11} className={activePreset === 'mumbai' ? 'text-white' : 'text-cyan-400'} />
            Mumbai & Western
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('east')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 active:scale-95 ${
              activePreset === 'east'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-white/10 hover:bg-indigo-500/20 text-slate-200 hover:text-indigo-300'
            }`}
          >
            <Sparkles size={11} className={activePreset === 'east' ? 'text-white' : 'text-indigo-400'} />
            East & Kolkata
          </button>
        </div>

        {/* Dynamic 3D Pin Hover Tooltip */}
        {hoveredNode && !selectedNode && (
          <div
            className={`absolute pointer-events-none z-40 transition-all duration-150 transform -translate-x-1/2 ${
              tooltipPos.y < 240 ? 'translate-y-4' : '-translate-y-full -translate-y-4'
            }`}
            style={{
              left: `${Math.max(160, Math.min(tooltipPos.x, window.innerWidth - 180))}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            {tooltipPos.y < 240 && (
              <div className="w-2.5 h-2.5 bg-slate-900/95 border-l border-t border-white/20 transform rotate-45 mx-auto -mb-1.5 relative z-10"></div>
            )}
            <div className="px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl text-white text-xs max-w-sm space-y-2">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                  style={{
                    backgroundColor: `${hoveredNode.colorHex.replace('0.95', '0.2')}`,
                    color: hoveredNode.colorHex,
                    borderColor: `${hoveredNode.colorHex.replace('0.95', '0.4')}`,
                  }}
                >
                  <Sparkles size={10} />
                  {hoveredNode.categoryLabel}
                </span>
                <span className="font-black text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {hoveredNode.complianceRate}% WCAG AA
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-100">{hoveredNode.name}</h4>
                <div className="text-[11px] text-slate-300">
                  {hoveredNode.district ? `${hoveredNode.district}, ` : ''}
                  {hoveredNode.stateOrZone}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                {hoveredNode.description}
              </p>

              <div className="pt-1.5 border-t border-white/10 flex flex-wrap gap-1">
                {hoveredNode.services.map((svc, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-[10px]"
                  >
                    {svc}
                  </span>
                ))}
              </div>

              <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between">
                <span>Lat: {hoveredNode.lat.toFixed(4)}°N, Lon: {hoveredNode.lon.toFixed(4)}°E</span>
                <span className="text-amber-400 font-bold">Click for full dossier</span>
              </div>
            </div>
            {tooltipPos.y >= 240 && (
              <div className="w-2.5 h-2.5 bg-slate-900/95 border-r border-b border-white/20 transform rotate-45 mx-auto -mt-1.5"></div>
            )}
          </div>
        )}

        {/* Selected Node Detailed Inspection Drawer */}
        {selectedNode && (
          <div className="absolute bottom-6 left-6 z-40 max-w-md w-full p-5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl text-white space-y-3 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${selectedNode.colorHex.replace('0.95', '0.2')}`,
                  color: selectedNode.colorHex,
                }}
              >
                {selectedNode.categoryLabel}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <MapPin size={16} className="text-amber-400 flex-shrink-0" />
                {selectedNode.name}
              </h3>
              <div className="text-xs text-slate-300">
                {selectedNode.district ? `${selectedNode.district}, ` : ''}
                {selectedNode.stateOrZone}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">WCAG 2.2 AA Rate</div>
                <div className="text-lg font-black text-emerald-400">{selectedNode.complianceRate}%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Citizen Gateways</div>
                <div className="text-lg font-black text-sky-400">{selectedNode.services.length} Online</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                Active Public Services:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.services.map((svc, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-xs"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            {selectedNode.portalUrl && (
              <div className="pt-2">
                <a
                  href={selectedNode.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                >
                  <ExternalLink size={13} />
                  Visit Official Public Portal
                </a>
              </div>
            )}
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-white/10 text-xs text-slate-300 z-30">
          <span className="font-bold text-white text-[11px]">Telemetry Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            Railways
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            Panchayats
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
            Municipal Bodies
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Central Govt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
            State Portals
          </span>
        </div>
      </div>

      {/* ─── NATIONAL 2,55,248 PANCHAYATS DIRECTORY DRAWER ─── */}
      {isPanchayatDirOpen && (
        <div
          className="absolute inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsPanchayatDirOpen(false)}
        >
          <div
            className="w-full max-w-2xl h-full bg-slate-900 border-l border-white/15 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    National Panchayati Raj Digital Directory
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      2,55,248 GPs
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    73rd Constitutional Amendment • Ministry of Panchayati Raj & LGD
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPanchayatDirOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title="Close Directory (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* National Governance Architecture Callout */}
            <div className="px-6 py-3.5 bg-gradient-to-r from-amber-950/40 to-slate-900 border-b border-amber-500/20 shrink-0">
              <div className="flex items-start gap-2.5">
                <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-amber-200">Why are 2,55,248 Panchayats federated?</strong> In India's constitutional governance model, individual village councils do not operate unmanaged independent web servers. Instead, citizen entitlements, property tax (Namune 8/Form 9/11), certificates, and digital payments are federated centrally through the Ministry of Panchayati Raj's <span className="text-white font-medium underline">eGramSwaraj</span> & state sovereign portals. AccessIQ audits both the master federations and individual grassroots village councils.
                </p>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div className="text-sm font-bold text-amber-400 font-mono">2,55,248</div>
                  <div className="text-[10px] text-slate-400">Gram Panchayats</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div className="text-sm font-bold text-sky-400 font-mono">~6,700</div>
                  <div className="text-[10px] text-slate-400">Block Panchayats</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div className="text-sm font-bold text-emerald-400 font-mono">765</div>
                  <div className="text-[10px] text-slate-400">Zilla Parishads</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div className="text-sm font-bold text-indigo-400 font-mono">100%</div>
                  <div className="text-[10px] text-slate-400">LGD Integrated</div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/10 bg-slate-950/40 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  placeholder="Search by state, platform name, or citizen services..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            </div>

            {/* Directory Cards List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {filteredDirectory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No state federations found matching "{dirSearchQuery}".
                </div>
              ) : (
                filteredDirectory.map((item) => (
                  <div
                    key={item.state}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.state}</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[11px] font-semibold border border-amber-500/30">
                            {item.panchayatCount.toLocaleString('en-IN')} GPs
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium mt-0.5">
                          {item.portalName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold ${
                            item.complianceRate >= 80
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.complianceRate >= 70
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.complianceRate}% WCAG
                        </span>
                        <a
                          href={item.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                          title={`Open ${item.portalName}`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      "{item.highlight}"
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.services.map((svc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px]"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span>Audited under GIGW 3.0 & WCAG 2.2 AA Standards</span>
              <button
                type="button"
                onClick={() => setIsPanchayatDirOpen(false)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Return to 3D Earth
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
