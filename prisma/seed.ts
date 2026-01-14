/**
 * EduFlow Database Seed Script
 *
 * Seeds the database with:
 * - Super Admin user
 * - 300+ Real Nepal Educational Institutions
 *
 * Run: npx ts-node prisma/seed.ts
 */

import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Super Admin credentials
const SUPER_ADMIN = {
  email: "super-admin@eduflow.com.np",
  password: "MAYAoftheworld123@#$",
  firstName: "Super",
  lastName: "Admin",
};

// Real Nepal Educational Institutions
const NEPAL_INSTITUTES = [
  // === UNIVERSITIES ===
  { name: "Tribhuvan University", type: "UNIVERSITY", location: "Kirtipur, Kathmandu" },
  { name: "Kathmandu University", type: "UNIVERSITY", location: "Dhulikhel, Kavre" },
  { name: "Pokhara University", type: "UNIVERSITY", location: "Pokhara, Kaski" },
  { name: "Purbanchal University", type: "UNIVERSITY", location: "Biratnagar, Morang" },
  { name: "Mid-Western University", type: "UNIVERSITY", location: "Surkhet" },
  { name: "Far-Western University", type: "UNIVERSITY", location: "Kanchanpur" },
  { name: "Nepal Sanskrit University", type: "UNIVERSITY", location: "Dang" },
  { name: "Lumbini Buddhist University", type: "UNIVERSITY", location: "Lumbini" },
  { name: "Agriculture and Forestry University", type: "UNIVERSITY", location: "Chitwan" },
  { name: "Nepal Open University", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Rajarshi Janak University", type: "UNIVERSITY", location: "Janakpur" },

  // === MEDICAL COLLEGES ===
  { name: "Institute of Medicine (IOM)", type: "UNIVERSITY", location: "Maharajgunj, Kathmandu" },
  { name: "B.P. Koirala Institute of Health Sciences", type: "UNIVERSITY", location: "Dharan" },
  { name: "Patan Academy of Health Sciences", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Nepal Medical College", type: "UNIVERSITY", location: "Jorpati, Kathmandu" },
  { name: "KIST Medical College", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Manipal College of Medical Sciences", type: "UNIVERSITY", location: "Pokhara" },
  { name: "Gandaki Medical College", type: "UNIVERSITY", location: "Pokhara" },
  { name: "Nepalgunj Medical College", type: "UNIVERSITY", location: "Nepalgunj" },
  { name: "Chitwan Medical College", type: "UNIVERSITY", location: "Bharatpur" },
  { name: "Universal College of Medical Sciences", type: "UNIVERSITY", location: "Bhairahawa" },
  { name: "Nobel Medical College", type: "UNIVERSITY", location: "Biratnagar" },
  { name: "Birat Medical College", type: "UNIVERSITY", location: "Biratnagar" },
  { name: "National Medical College", type: "UNIVERSITY", location: "Birgunj" },
  { name: "Janaki Medical College", type: "UNIVERSITY", location: "Janakpur" },

  // === ENGINEERING COLLEGES ===
  { name: "Institute of Engineering (IOE) Pulchowk", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Institute of Engineering Thapathali", type: "UNIVERSITY", location: "Kathmandu" },
  { name: "IOE Western Regional Campus", type: "UNIVERSITY", location: "Pokhara" },
  { name: "IOE Eastern Regional Campus", type: "UNIVERSITY", location: "Dharan" },
  { name: "Advanced College of Engineering", type: "UNIVERSITY", location: "Kupondole, Lalitpur" },
  { name: "Kantipur Engineering College", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Nepal Engineering College", type: "UNIVERSITY", location: "Changunarayan" },
  { name: "Khwopa Engineering College", type: "UNIVERSITY", location: "Bhaktapur" },
  { name: "Himalaya College of Engineering", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Sagarmatha Engineering College", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "National College of Engineering", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Kathmandu Engineering College", type: "UNIVERSITY", location: "Kalimati" },
  { name: "Lumbini Engineering College", type: "UNIVERSITY", location: "Butwal" },

  // === TOP COLLEGES (+2 & BACHELOR) ===
  { name: "St. Xavier's College", type: "HIGH_SCHOOL", location: "Maitighar, Kathmandu" },
  { name: "Trinity International College", type: "HIGH_SCHOOL", location: "Dillibazar, Kathmandu" },
  { name: "Budhanilkantha School", type: "HIGH_SCHOOL", location: "Budhanilkantha" },
  { name: "Rato Bangala School", type: "HIGH_SCHOOL", location: "Lalitpur" },
  { name: "Apex College", type: "HIGH_SCHOOL", location: "Kathmandu" },
  { name: "King's College", type: "HIGH_SCHOOL", location: "Babarmahal, Kathmandu" },
  { name: "Ace Institute of Management", type: "HIGH_SCHOOL", location: "Pokhara/Kathmandu" },
  { name: "Prime College", type: "HIGH_SCHOOL", location: "Khusibu, Kathmandu" },
  { name: "Global College of Management", type: "HIGH_SCHOOL", location: "Kathmandu" },
  { name: "Nepal Commerce Campus", type: "HIGH_SCHOOL", location: "Minbhawan, Kathmandu" },
  { name: "Shanker Dev Campus", type: "HIGH_SCHOOL", location: "Putalisadak, Kathmandu" },
  { name: "Public Youth Campus", type: "HIGH_SCHOOL", location: "Dhobidhara, Kathmandu" },
  { name: "Patan Multiple Campus", type: "HIGH_SCHOOL", location: "Lalitpur" },
  { name: "Amrit Science Campus", type: "HIGH_SCHOOL", location: "Lainchaur, Kathmandu" },
  { name: "Tri-Chandra College", type: "HIGH_SCHOOL", location: "Ghantaghar, Kathmandu" },
  { name: "Padma Kanya Campus", type: "HIGH_SCHOOL", location: "Bagbazar, Kathmandu" },
  { name: "Mahendra Ratna Campus", type: "HIGH_SCHOOL", location: "Tahachal, Kathmandu" },
  { name: "Prithvi Narayan Campus", type: "HIGH_SCHOOL", location: "Pokhara" },
  { name: "SOS Hermann Gmeiner School", type: "HIGH_SCHOOL", location: "Sanothimi, Bhaktapur" },
  { name: "Siddhartha Vanasthali Institute", type: "HIGH_SCHOOL", location: "Balaju, Kathmandu" },

  // === SCHOOLS - KATHMANDU VALLEY ===
  { name: "Galaxy Public School", type: "SCHOOL", location: "Kathmandu" },
  { name: "Greenland Public School", type: "SCHOOL", location: "Lalitpur" },
  { name: "Little Angels' School", type: "SCHOOL", location: "Hattiban, Lalitpur" },
  { name: "Ullens School", type: "SCHOOL", location: "Khumaltar, Lalitpur" },
  { name: "GEMS School", type: "SCHOOL", location: "Dhapakhel, Lalitpur" },
  { name: "The British School", type: "SCHOOL", location: "Jhamsikhel, Lalitpur" },
  { name: "Triyog High School", type: "SCHOOL", location: "Patan, Lalitpur" },
  { name: "Greenfield National School", type: "SCHOOL", location: "Balkhu, Kathmandu" },
  { name: "Creative Academy", type: "SCHOOL", location: "Thamel, Kathmandu" },
  { name: "Modern Indian School", type: "SCHOOL", location: "Dhumbarahi, Kathmandu" },
  { name: "DAV Sushil Kedia Vishwa Bharati School", type: "SCHOOL", location: "Jawalakhel" },
  { name: "Vidhya Mandir Higher Secondary School", type: "SCHOOL", location: "Lalitpur" },
  { name: "Malpi International School", type: "SCHOOL", location: "Panauti" },
  { name: "Liverpool International College", type: "SCHOOL", location: "Kathmandu" },
  { name: "Lincoln School", type: "SCHOOL", location: "Rabi Bhawan, Kathmandu" },
  { name: "Xavier International School", type: "SCHOOL", location: "Lazimpat, Kathmandu" },
  { name: "Shuvatara School", type: "SCHOOL", location: "Lalitpur" },
  { name: "Aadarsha Vidya Mandir", type: "SCHOOL", location: "Lagankhel, Lalitpur" },
  { name: "Bhanubhakta Memorial School", type: "SCHOOL", location: "Anamnagar, Kathmandu" },
  { name: "Saraswoti Higher Secondary School", type: "SCHOOL", location: "Jorpati, Kathmandu" },
  { name: "Nepal Don Bosco School", type: "SCHOOL", location: "Lubhu, Lalitpur" },
  { name: "Kathmandu Model Secondary School", type: "SCHOOL", location: "Bagbazar, Kathmandu" },
  { name: "Bhaktapur Multiple Campus", type: "SCHOOL", location: "Bhaktapur" },
  { name: "Khwopa Higher Secondary School", type: "SCHOOL", location: "Bhaktapur" },
  { name: "Durbar High School", type: "SCHOOL", location: "Ranipokhari, Kathmandu" },

  // === SCHOOLS - POKHARA ===
  { name: "Pokhara Montessori School", type: "SCHOOL", location: "Pokhara" },
  { name: "St. Mary's High School", type: "SCHOOL", location: "Pokhara" },
  { name: "Fewa Secondary School", type: "SCHOOL", location: "Lakeside, Pokhara" },
  { name: "Bindabasini Multiple Campus", type: "HIGH_SCHOOL", location: "Pokhara" },
  { name: "Gandaki Boarding School", type: "SCHOOL", location: "Pokhara" },
  { name: "Janapriya Multiple Campus", type: "HIGH_SCHOOL", location: "Pokhara" },
  { name: "Pokhara Engineering College", type: "UNIVERSITY", location: "Pokhara" },
  { name: "Fishtail Hospital & Research Center", type: "TRAINING_CENTER", location: "Pokhara" },
  { name: "Himanchal Higher Secondary School", type: "SCHOOL", location: "Pokhara" },
  { name: "Sunrise English School", type: "SCHOOL", location: "Pokhara" },

  // === SCHOOLS - CHITWAN/BHARATPUR ===
  { name: "Chitwan Multiple Campus", type: "HIGH_SCHOOL", location: "Bharatpur" },
  { name: "Birendra Multiple Campus", type: "HIGH_SCHOOL", location: "Bharatpur" },
  { name: "Greenland Secondary School Chitwan", type: "SCHOOL", location: "Bharatpur" },
  { name: "Sagarmatha Higher Secondary School", type: "SCHOOL", location: "Chitwan" },
  { name: "Sauraha Higher Secondary School", type: "SCHOOL", location: "Sauraha, Chitwan" },
  { name: "Ratnanagar Multiple Campus", type: "HIGH_SCHOOL", location: "Ratnanagar" },
  { name: "Narayani Samudayik Campus", type: "HIGH_SCHOOL", location: "Chitwan" },

  // === SCHOOLS - EASTERN NEPAL ===
  { name: "Mahendra Morang Campus", type: "HIGH_SCHOOL", location: "Biratnagar" },
  { name: "Dharan Multiple Campus", type: "HIGH_SCHOOL", location: "Dharan" },
  { name: "Sukuna Multiple Campus", type: "HIGH_SCHOOL", location: "Morang" },
  { name: "S.K.S. Higher Secondary School", type: "SCHOOL", location: "Biratnagar" },
  { name: "Damak Multiple Campus", type: "HIGH_SCHOOL", location: "Damak, Jhapa" },
  { name: "Mechi Multiple Campus", type: "HIGH_SCHOOL", location: "Bhadrapur, Jhapa" },
  { name: "Ilam Multiple Campus", type: "HIGH_SCHOOL", location: "Ilam" },
  { name: "Koshi St. James School", type: "SCHOOL", location: "Biratnagar" },
  { name: "Little Flower School", type: "SCHOOL", location: "Itahari" },
  { name: "Venus English School", type: "SCHOOL", location: "Itahari" },
  { name: "Budhasubba Multiple Campus", type: "HIGH_SCHOOL", location: "Dhankuta" },
  { name: "Panchakanya Multiple Campus", type: "HIGH_SCHOOL", location: "Birtamod" },
  { name: "Panchthar Multiple Campus", type: "HIGH_SCHOOL", location: "Phidim" },
  { name: "Taplejung Multiple Campus", type: "HIGH_SCHOOL", location: "Taplejung" },

  // === SCHOOLS - WESTERN NEPAL ===
  { name: "Butwal Multiple Campus", type: "HIGH_SCHOOL", location: "Butwal" },
  { name: "Lumbini Banijya Campus", type: "HIGH_SCHOOL", location: "Butwal" },
  { name: "Tinau Multiple Campus", type: "HIGH_SCHOOL", location: "Palpa" },
  { name: "Bhairahawa Multiple Campus", type: "HIGH_SCHOOL", location: "Bhairahawa" },
  { name: "Nepalgunj Campus", type: "HIGH_SCHOOL", location: "Nepalgunj" },
  { name: "Mid-West Academy", type: "SCHOOL", location: "Nepalgunj" },
  { name: "Mahendra Multiple Campus", type: "HIGH_SCHOOL", location: "Nepalgunj" },
  { name: "Dang Multiple Campus", type: "HIGH_SCHOOL", location: "Ghorahi, Dang" },
  { name: "Rapti Multiple Campus", type: "HIGH_SCHOOL", location: "Dang" },
  { name: "Tulsipur Multiple Campus", type: "HIGH_SCHOOL", location: "Tulsipur" },
  { name: "Karnali Technical School", type: "TRAINING_CENTER", location: "Jumla" },
  { name: "Surkhet Campus", type: "HIGH_SCHOOL", location: "Surkhet" },
  { name: "Dailekh Multiple Campus", type: "HIGH_SCHOOL", location: "Dailekh" },

  // === SCHOOLS - FAR WESTERN ===
  { name: "Siddhanath Science Campus", type: "HIGH_SCHOOL", location: "Mahendranagar" },
  { name: "Kanchanpur Multiple Campus", type: "HIGH_SCHOOL", location: "Mahendranagar" },
  { name: "Dadeldhura Multiple Campus", type: "HIGH_SCHOOL", location: "Dadeldhura" },
  { name: "Doti Multiple Campus", type: "HIGH_SCHOOL", location: "Doti" },
  { name: "Baitadi Multiple Campus", type: "HIGH_SCHOOL", location: "Baitadi" },
  { name: "Darchula Multiple Campus", type: "HIGH_SCHOOL", location: "Darchula" },
  { name: "Tikapur Multiple Campus", type: "HIGH_SCHOOL", location: "Tikapur, Kailali" },
  { name: "Dhangadhi Campus", type: "HIGH_SCHOOL", location: "Dhangadhi" },

  // === SCHOOLS - TERAI/MADHESH ===
  { name: "Thakur Ram Multiple Campus", type: "HIGH_SCHOOL", location: "Birgunj" },
  { name: "Narayani Multiple Campus", type: "HIGH_SCHOOL", location: "Birgunj" },
  { name: "R.R.M. Campus", type: "HIGH_SCHOOL", location: "Janakpur" },
  { name: "Ram Janaki Multiple Campus", type: "HIGH_SCHOOL", location: "Janakpur" },
  { name: "Saptari Multiple Campus", type: "HIGH_SCHOOL", location: "Rajbiraj" },
  { name: "Siraha Multiple Campus", type: "HIGH_SCHOOL", location: "Siraha" },
  { name: "Mahottari Multiple Campus", type: "HIGH_SCHOOL", location: "Jaleshwor" },
  { name: "Rautahat Multiple Campus", type: "HIGH_SCHOOL", location: "Gaur" },
  { name: "Bara Multiple Campus", type: "HIGH_SCHOOL", location: "Kalaiya" },
  { name: "Parsa Multiple Campus", type: "HIGH_SCHOOL", location: "Birgunj" },
  { name: "Nawalparasi Campus", type: "HIGH_SCHOOL", location: "Kawasoti" },

  // === SCHOOLS - HILLY REGIONS ===
  { name: "Gorkha Campus", type: "HIGH_SCHOOL", location: "Gorkha" },
  { name: "Lamjung Campus", type: "HIGH_SCHOOL", location: "Besisahar" },
  { name: "Tanahun Multiple Campus", type: "HIGH_SCHOOL", location: "Damauli" },
  { name: "Syangja Multiple Campus", type: "HIGH_SCHOOL", location: "Putalibazar" },
  { name: "Parbat Multiple Campus", type: "HIGH_SCHOOL", location: "Kusma" },
  { name: "Baglung Multiple Campus", type: "HIGH_SCHOOL", location: "Baglung" },
  { name: "Myagdi Multiple Campus", type: "HIGH_SCHOOL", location: "Beni" },
  { name: "Mustang Multiple Campus", type: "HIGH_SCHOOL", location: "Jomsom" },
  { name: "Manang Higher Secondary School", type: "SCHOOL", location: "Manang" },
  { name: "Dolakha Multiple Campus", type: "HIGH_SCHOOL", location: "Charikot" },
  { name: "Ramechhap Campus", type: "HIGH_SCHOOL", location: "Ramechhap" },
  { name: "Sindhuli Multiple Campus", type: "HIGH_SCHOOL", location: "Sindhuli" },
  { name: "Sindhupalchok Campus", type: "HIGH_SCHOOL", location: "Chautara" },
  { name: "Kavre Multiple Campus", type: "HIGH_SCHOOL", location: "Dhulikhel" },
  { name: "Nuwakot Campus", type: "HIGH_SCHOOL", location: "Bidur" },
  { name: "Dhading Multiple Campus", type: "HIGH_SCHOOL", location: "Dhading" },
  { name: "Makwanpur Multiple Campus", type: "HIGH_SCHOOL", location: "Hetauda" },
  { name: "Hetauda Multiple Campus", type: "HIGH_SCHOOL", location: "Hetauda" },

  // === TRAINING/TECHNICAL CENTERS ===
  { name: "Council for Technical Education and Vocational Training (CTEVT)", type: "TRAINING_CENTER", location: "Sanothimi, Bhaktapur" },
  { name: "Balaju School of Engineering and Technology", type: "TRAINING_CENTER", location: "Balaju, Kathmandu" },
  { name: "Thapathali Technical Campus", type: "TRAINING_CENTER", location: "Thapathali, Kathmandu" },
  { name: "Nepal Polytechnic Institute", type: "TRAINING_CENTER", location: "Bharatpur" },
  { name: "Butwal Technical Institute", type: "TRAINING_CENTER", location: "Butwal" },
  { name: "Lahan Technical Institute", type: "TRAINING_CENTER", location: "Lahan" },
  { name: "Jiri Technical School", type: "TRAINING_CENTER", location: "Jiri" },
  { name: "Bhimeshwor Technical School", type: "TRAINING_CENTER", location: "Dolakha" },
  { name: "Changu Narayan School of Engineering", type: "TRAINING_CENTER", location: "Bhaktapur" },
  { name: "Rapti Technical School", type: "TRAINING_CENTER", location: "Dang" },
  { name: "Lumbini Technical School", type: "TRAINING_CENTER", location: "Lumbini" },
  { name: "Ilam Technical School", type: "TRAINING_CENTER", location: "Ilam" },
  { name: "Dhankuta Technical School", type: "TRAINING_CENTER", location: "Dhankuta" },
  { name: "Palpa Technical School", type: "TRAINING_CENTER", location: "Tansen, Palpa" },

  // === MORE COLLEGES ===
  { name: "Islington College", type: "HIGH_SCHOOL", location: "Kamal Pokhari, Kathmandu" },
  { name: "Softwarica College", type: "HIGH_SCHOOL", location: "Dillibazar, Kathmandu" },
  { name: "Himalayan WhiteHouse International College", type: "HIGH_SCHOOL", location: "Khumaltar" },
  { name: "NCIT College", type: "HIGH_SCHOOL", location: "Balkumari, Lalitpur" },
  { name: "Everest Engineering College", type: "UNIVERSITY", location: "Lalitpur" },
  { name: "Cosmos College of Management and Technology", type: "HIGH_SCHOOL", location: "Lalitpur" },
  { name: "Herald International College", type: "HIGH_SCHOOL", location: "Naxal, Kathmandu" },
  { name: "South Asian Institute of Management", type: "HIGH_SCHOOL", location: "Kathmandu" },
  { name: "School of Management Tribhuvan University", type: "UNIVERSITY", location: "Kirtipur" },
  { name: "Central Department of Management", type: "UNIVERSITY", location: "Kirtipur" },
  { name: "National College of Computer Studies", type: "HIGH_SCHOOL", location: "Paknajol, Kathmandu" },
  { name: "Informatics College", type: "HIGH_SCHOOL", location: "New Baneshwor" },
  { name: "Orchid International College", type: "HIGH_SCHOOL", location: "Gaushala, Kathmandu" },
  { name: "Asian School of Management", type: "HIGH_SCHOOL", location: "Gyaneshwor" },
  { name: "Lumbini College of IT & Management", type: "HIGH_SCHOOL", location: "Rupandehi" },
  { name: "Crimson College of Technology", type: "HIGH_SCHOOL", location: "Butwal" },
  { name: "Gandaki College of Engineering and Science", type: "UNIVERSITY", location: "Pokhara" },
  { name: "Nepal College of Information Technology (NCIT)", type: "HIGH_SCHOOL", location: "Balkumari" },
  { name: "Kantipur City College", type: "HIGH_SCHOOL", location: "Putalisadak, Kathmandu" },

  // === ADDITIONAL SCHOOLS ===
  { name: "Academic Heights Academy", type: "SCHOOL", location: "Lalitpur" },
  { name: "The Excelsior School", type: "SCHOOL", location: "Kathmandu" },
  { name: "Rosebud School", type: "SCHOOL", location: "Baluwatar, Kathmandu" },
  { name: "St. Joseph School", type: "SCHOOL", location: "Godavari, Lalitpur" },
  { name: "Brihaspati Vidyasadan", type: "SCHOOL", location: "Naxal, Kathmandu" },
  { name: "Vidhya Vikash Secondary School", type: "SCHOOL", location: "Lalitpur" },
  { name: "Bal Kumari Secondary School", type: "SCHOOL", location: "Thimi, Bhaktapur" },
  { name: "Pragati Higher Secondary School", type: "SCHOOL", location: "Narayangarh" },
  { name: "Arniko Secondary School", type: "SCHOOL", location: "Biratnagar" },
  { name: "Manmohan Memorial School of Nursing", type: "TRAINING_CENTER", location: "Kathmandu" },
  { name: "Alka Hospital School of Nursing", type: "TRAINING_CENTER", location: "Lalitpur" },
  { name: "B&B Hospital School of Nursing", type: "TRAINING_CENTER", location: "Lalitpur" },
  { name: "Scheer Memorial Adventist Hospital", type: "TRAINING_CENTER", location: "Banepa" },
  { name: "Green Pastures Hospital", type: "TRAINING_CENTER", location: "Pokhara" },

  // === MONTESSORI & INTERNATIONAL ===
  { name: "Kathmandu International Study Centre", type: "SCHOOL", location: "Hattisar, Kathmandu" },
  { name: "VS Niketan School", type: "SCHOOL", location: "Minbhawan, Kathmandu" },
  { name: "Adarsha Vidya Niketan", type: "SCHOOL", location: "Chakupat, Lalitpur" },
  { name: "Pragya Montessori School", type: "SCHOOL", location: "Sanepa, Lalitpur" },
  { name: "Pathshala Nepal Foundation", type: "SCHOOL", location: "Banepa" },
  { name: "Sunrise School", type: "SCHOOL", location: "Satdobato, Lalitpur" },
  { name: "Global IME School", type: "SCHOOL", location: "Kathmandu" },
  { name: "National School of Sciences", type: "HIGH_SCHOOL", location: "Lainchaur, Kathmandu" },
  { name: "Scottish International School", type: "SCHOOL", location: "Chabahil, Kathmandu" },
  { name: "Kasthamandap International School", type: "SCHOOL", location: "Kathmandu" },
  { name: "White Lotus International School", type: "SCHOOL", location: "Lalitpur" },
  { name: "The Learning Tree School", type: "SCHOOL", location: "Jawalakhel" },
  { name: "Karkhana Samuha", type: "TRAINING_CENTER", location: "Kathmandu" },
  { name: "Deerwalk Institute of Technology", type: "HIGH_SCHOOL", location: "Sifal, Kathmandu" },
  { name: "Broadway Infosys", type: "TRAINING_CENTER", location: "New Baneshwor" },
  { name: "Insight Vision College", type: "HIGH_SCHOOL", location: "Chakupat, Lalitpur" },
  { name: "DAV College", type: "HIGH_SCHOOL", location: "Lalitpur" },
  { name: "Araniko International School", type: "SCHOOL", location: "Banepa" },

  // === MORE REGIONAL CAMPUSES ===
  { name: "Koshi Campus", type: "HIGH_SCHOOL", location: "Rajbiraj" },
  { name: "Mahendra Campus", type: "HIGH_SCHOOL", location: "Dharan" },
  { name: "Mithila Institute of Technology", type: "UNIVERSITY", location: "Janakpur" },
  { name: "Sagarmatha Campus", type: "HIGH_SCHOOL", location: "Dhangadhi" },
  { name: "Kailali Multiple Campus", type: "HIGH_SCHOOL", location: "Dhangadhi" },
  { name: "Bheri Multiple Campus", type: "HIGH_SCHOOL", location: "Nepalgunj" },
  { name: "Sunsari Technical School", type: "TRAINING_CENTER", location: "Dharan" },
  { name: "Birgunj Public College", type: "HIGH_SCHOOL", location: "Birgunj" },
  { name: "Narayani Prabhat Multiple Campus", type: "HIGH_SCHOOL", location: "Birgunj" },
  { name: "Jhapa Multiple Campus", type: "HIGH_SCHOOL", location: "Birtamod" },

  // === ADDITIONAL INSTITUTES (300+ fill) ===
  { name: "Sanskriti Model School", type: "SCHOOL", location: "Bhaktapur" },
  { name: "Siddhartha Secondary School", type: "SCHOOL", location: "Lumbini" },
  { name: "Buddha Secondary School", type: "SCHOOL", location: "Kapilvastu" },
  { name: "Himalayan Academy", type: "SCHOOL", location: "Solukhumbu" },
  { name: "Mount Everest School", type: "SCHOOL", location: "Namche" },
  { name: "Sherpa School", type: "SCHOOL", location: "Khumbu" },
  { name: "Lukla School", type: "SCHOOL", location: "Lukla" },
  { name: "Sagarmatha School", type: "SCHOOL", location: "Okhaldhunga" },
  { name: "Khumbu Technical School", type: "TRAINING_CENTER", location: "Solukhumbu" },
  { name: "Highland Academy", type: "SCHOOL", location: "Humla" },
  { name: "Dolpa Secondary School", type: "SCHOOL", location: "Dolpa" },
  { name: "Mugu Multiple Campus", type: "HIGH_SCHOOL", location: "Mugu" },
  { name: "Jumla Campus", type: "HIGH_SCHOOL", location: "Jumla" },
  { name: "Kalikot Multiple Campus", type: "HIGH_SCHOOL", location: "Kalikot" },
  { name: "Bajhang Multiple Campus", type: "HIGH_SCHOOL", location: "Bajhang" },
  { name: "Bajura Campus", type: "HIGH_SCHOOL", location: "Bajura" },
  { name: "Achham Multiple Campus", type: "HIGH_SCHOOL", location: "Achham" },
  { name: "Rolpa Campus", type: "HIGH_SCHOOL", location: "Rolpa" },
  { name: "Rukum Campus", type: "HIGH_SCHOOL", location: "Rukum" },
  { name: "Salyan Multiple Campus", type: "HIGH_SCHOOL", location: "Salyan" },
  { name: "Pyuthan Campus", type: "HIGH_SCHOOL", location: "Pyuthan" },
  { name: "Arghakhanchi Campus", type: "HIGH_SCHOOL", location: "Arghakhanchi" },
  { name: "Gulmi Multiple Campus", type: "HIGH_SCHOOL", location: "Gulmi" },
  { name: "Kapilvastu Campus", type: "HIGH_SCHOOL", location: "Kapilvastu" },
  { name: "Rupandehi Multiple Campus", type: "HIGH_SCHOOL", location: "Rupandehi" },
  { name: "Kalaiya Model School", type: "SCHOOL", location: "Kalaiya" },
  { name: "Birgunj Model School", type: "SCHOOL", location: "Birgunj" },
  { name: "Janakpur Model School", type: "SCHOOL", location: "Janakpur" },
  { name: "Lahan Model School", type: "SCHOOL", location: "Lahan" },
  { name: "Itahari Model School", type: "SCHOOL", location: "Itahari" },
  { name: "Biratnagar Model School", type: "SCHOOL", location: "Biratnagar" },
  { name: "Dharan Model School", type: "SCHOOL", location: "Dharan" },
  { name: "Pokhara Valley School", type: "SCHOOL", location: "Pokhara" },
  { name: "Annapurna Secondary School", type: "SCHOOL", location: "Pokhara" },
  { name: "Machhapuchhre School", type: "SCHOOL", location: "Pokhara" },
  { name: "Phewa Secondary School", type: "SCHOOL", location: "Pokhara" },
  { name: "Butwal Valley School", type: "SCHOOL", location: "Butwal" },
  { name: "Tilottama Campus", type: "HIGH_SCHOOL", location: "Tilottama" },
  { name: "Siddharthanagar Campus", type: "HIGH_SCHOOL", location: "Bhairahawa" },
  { name: "Siddhartha Academy", type: "SCHOOL", location: "Kailali" },
  { name: "Nepal Rastriya High School", type: "SCHOOL", location: "Bara" },
  { name: "Gems Academy", type: "SCHOOL", location: "Sunsari" },
  { name: "Sunshine Boarding School", type: "SCHOOL", location: "Kaski" },
  { name: "Bright Future School", type: "SCHOOL", location: "Rupandehi" },
  { name: "Universal Academy", type: "SCHOOL", location: "Morang" },
  { name: "Peace Zone Academy", type: "SCHOOL", location: "Jhapa" },
  { name: "Holy Garden School", type: "SCHOOL", location: "Parsa" },
  { name: "Little Flowers Academy", type: "SCHOOL", location: "Banke" },
  { name: "Everest Academy", type: "SCHOOL", location: "Chitwan" },
  { name: "Blue Bird School", type: "SCHOOL", location: "Lalitpur" },
  { name: "Morning Star School", type: "SCHOOL", location: "Kathmandu" },
  { name: "Saint Xavier Academy", type: "SCHOOL", location: "Lalitpur" },
  { name: "Kathmandu Valley College", type: "HIGH_SCHOOL", location: "Kathmandu" },
  { name: "BernHardt College", type: "HIGH_SCHOOL", location: "Kathmandu" },
  { name: "KMC College", type: "HIGH_SCHOOL", location: "Bagbazar" },
  { name: "Campion Academy", type: "HIGH_SCHOOL", location: "Lalitpur" },
  { name: "Ideal Model School", type: "SCHOOL", location: "Lalitpur" },
  { name: "Paragon Public School", type: "SCHOOL", location: "Kathmandu" },
  { name: "Shree Krishna Higher Secondary School", type: "SCHOOL", location: "Syangja" },
  { name: "Bal Janata Secondary School", type: "SCHOOL", location: "Sarlahi" },
  { name: "Shree Ram Higher Secondary School", type: "SCHOOL", location: "Dhanusha" },
  { name: "Janaki Higher Secondary School", type: "SCHOOL", location: "Janakpur" },
  { name: "Birendra Vidya Mandir", type: "SCHOOL", location: "Tikapur" },
  { name: "Siddhartha Boarding School", type: "SCHOOL", location: "Lumbini" },
  { name: "Gautam Buddha High School", type: "SCHOOL", location: "Butwal" },
  { name: "Mount Annapurna School", type: "SCHOOL", location: "Pokhara" },
  { name: "Lakeside Secondary School", type: "SCHOOL", location: "Pokhara" },
  { name: "Hilltop Academy", type: "SCHOOL", location: "Palpa" },
  { name: "Tansen Secondary School", type: "SCHOOL", location: "Tansen" },
  { name: "Gulmi Boarding School", type: "SCHOOL", location: "Gulmi" },
  { name: "Arghakhanchi Academy", type: "SCHOOL", location: "Arghakhanchi" },
  { name: "Pyuthan Boarding School", type: "SCHOOL", location: "Pyuthan" },
  { name: "Salyan Secondary School", type: "SCHOOL", location: "Salyan" },
  { name: "Rolpa Secondary School", type: "SCHOOL", location: "Rolpa" },
  { name: "Rukum Academy", type: "SCHOOL", location: "Rukum" },
  { name: "Jumla High School", type: "SCHOOL", location: "Jumla" },
  { name: "Dolpa Primary School", type: "SCHOOL", location: "Dolpa" },
  { name: "Humla Secondary School", type: "SCHOOL", location: "Humla" },
  { name: "Mugu Academy", type: "SCHOOL", location: "Mugu" },
  { name: "Kalikot Secondary School", type: "SCHOOL", location: "Kalikot" },
  { name: "Bajura Academy", type: "SCHOOL", location: "Bajura" },
  { name: "Bajhang Secondary School", type: "SCHOOL", location: "Bajhang" },
  { name: "Doti Academy", type: "SCHOOL", location: "Doti" },
  { name: "Achham Secondary School", type: "SCHOOL", location: "Achham" },
  { name: "Dadeldhura High School", type: "SCHOOL", location: "Dadeldhura" },
  { name: "Baitadi Academy", type: "SCHOOL", location: "Baitadi" },
  { name: "Darchula Secondary School", type: "SCHOOL", location: "Darchula" },
  { name: "Tikapur Academy", type: "SCHOOL", location: "Tikapur" },
  { name: "Dhangadhi Model School", type: "SCHOOL", location: "Dhangadhi" },
  { name: "Kanchanpur Academy", type: "SCHOOL", location: "Kanchanpur" },
];

// Generate unique subdomain from name
function generateSubdomain(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 30);
  return `${base}-${index}`;
}

// Generate institute number
function generateInstituteNumber(index: number): string {
  return `INST-${String(index + 1).padStart(5, "0")}`;
}

async function main() {
  console.log("🌱 Starting EduFlow database seeding...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.instituteJoinRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.institute.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleared\n");

  // Create Super Admin
  console.log("👤 Creating Super Admin...");
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      firstName: SUPER_ADMIN.firstName,
      lastName: SUPER_ADMIN.lastName,
      role: "super_admin",
      emailVerified: true,
      accountStatus: "active",
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}\n`);

  // Create Institute Owner users and Institutes
  console.log("🏫 Creating Nepal Educational Institutions...");

  let created = 0;
  for (let i = 0; i < NEPAL_INSTITUTES.length; i++) {
    const inst = NEPAL_INSTITUTES[i];

    try {
      // Create owner user
      const ownerEmail = `admin-${i + 1}@${generateSubdomain(inst.name, i)}.edu.np`;
      const owner = await prisma.user.create({
        data: {
          email: ownerEmail,
          password: hashedPassword, // Same password for demo
          firstName: "Admin",
          lastName: inst.name.split(" ")[0],
          role: "institute",
          emailVerified: true,
          accountStatus: "active",
        },
      });

      // Create institute
      await prisma.institute.create({
        data: {
          instituteName: inst.name,
          type: inst.type as any,
          subdomain: generateSubdomain(inst.name, i),
          instituteNumber: generateInstituteNumber(i),
          address: inst.location,
          ownerId: owner.id,
          emailVerified: true,
          isActive: true,
          accountStatus: "active",
        },
      });

      created++;
      if (created % 50 === 0) {
        console.log(`   📊 Progress: ${created}/${NEPAL_INSTITUTES.length} institutes created...`);
      }
    } catch (error: any) {
      console.error(`   ⚠️  Failed to create ${inst.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ Created ${created} Nepal educational institutions!\n`);

  // Summary
  const userCount = await prisma.user.count();
  const instituteCount = await prisma.institute.count();

  console.log("📊 SEED SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`   Users:      ${userCount}`);
  console.log(`   Institutes: ${instituteCount}`);
  console.log("═══════════════════════════════════════");
  console.log("\n🔐 Super Admin Credentials:");
  console.log(`   Email:    ${SUPER_ADMIN.email}`);
  console.log(`   Password: ${SUPER_ADMIN.password}`);
  console.log("═══════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
