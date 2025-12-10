import { useState, useRef, useEffect } from 'react';
import DatePicker, { registerLocale } from "react-datepicker";
import Select from 'react-select';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { format, addDays, subDays } from 'date-fns';
import '../styles/Home.css';
import '../styles/Dashboard.css';
import dropdownArrow from '../assets/dropdown-menu-arrow.svg';

registerLocale('es', es);

// Custom Styles for React Select
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    height: '52px',
    borderRadius: '12px',
    border: state.isFocused ? '1px solid #000000' : '1px solid #e5e7eb',
    boxShadow: 'none',
    backgroundColor: '#f9fafb',
    paddingLeft: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: '#000000',
      backgroundColor: '#ffffff'
    }
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '16px',
    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0,0,0,0.05)',
    overflow: 'hidden',
    zIndex: 9999,
    marginTop: '8px',
    padding: '6px',
    backgroundColor: '#ffffff',
    animation: 'dropdownFadeIn 0.2s ease-out'
  }),
  option: (provided, state) => ({
    ...provided,
    borderRadius: '8px',
    margin: '2px 0',
    backgroundColor: state.isSelected ? '#000000' : state.isFocused ? '#f3f4f6' : 'transparent',
    color: state.isSelected ? '#ffffff' : state.isFocused ? '#000000' : '#1f2937',
    cursor: 'pointer',
    padding: '10px 12px',
    fontSize: '0.9rem',
    fontWeight: state.isSelected ? 600 : 400,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: state.isSelected ? '#000000' : '#e5e7eb',
      color: state.isSelected ? '#ffffff' : '#000000',
    },
    '&:active': {
      transform: 'scale(0.98)'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#111827',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
    fontSize: '0.95rem',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    padding: '0 12px',
    '&:hover': {
      color: '#1a1a1a'
    }
  }),
  indicatorSeparator: () => ({
    display: 'none'
  })
};

// Options for Selects
const sortOptions = [
  { value: 'distance', label: 'Distancia' },
  { value: 'price', label: 'Precio' }
];

const courtOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'wall', label: 'Muro' },
  { value: 'glass', label: 'Cristal' }
];

function Dashboard({ onNavigate }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'club-search' | 'club-details'
  const [selectedClub, setSelectedClub] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null); // Estado para el usuario
  const scrollContainerRefs = useRef({});
  
  // Search States
  const [filters, setFilters] = useState({
    searchQuery: '',
    courtType: 'all', // 'wall', 'glass'
    date: new Date(),
    timeStart: null,
    timeEnd: null,
    sortBy: 'distance' // 'distance', 'price'
  });

  // 1. CARGAR DATOS DEL USUARIO
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            setCurrentUser(JSON.parse(userStr));
        } catch (e) {
            console.error("Error leyendo usuario", e);
        }
    }
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onNavigate('auth'); // O 'home'
  };

  const handleClubClick = (club) => {
    // If club doesn't have full details, find it in allClubs
    const fullClubData = club.courts ? club : allClubs.find(c => c.id === club.id);
    setSelectedClub(fullClubData || club);
    setView('club-details');
    setBookingDate(new Date());
    setCurrentImageIndex(0);
    window.scrollTo(0, 0);
  };

  const [selectedSlot, setSelectedSlot] = useState(null); // { courtId, time, price, duration }
  const [hoveredSlot, setHoveredSlot] = useState(null); // { courtId, time }
  const [dateTransitioning, setDateTransitioning] = useState(false);
  const [dateDirection, setDateDirection] = useState('right'); // 'left' or 'right'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle date change with animation
  const handleDateChange = (newDate, direction) => {
    setDateDirection(direction);
    setDateTransitioning(true);
    setTimeout(() => {
      setBookingDate(newDate);
      setDateTransitioning(false);
    }, 75);
  };

  // Image carousel auto-rotation
  useEffect(() => {
    if (view === 'club-details' && selectedClub && selectedClub.galleryImages) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % selectedClub.galleryImages.length
        );
      }, 3000); // Change image every 3 seconds

      return () => clearInterval(interval);
    }
  }, [view, selectedClub]);

  // Helper function to get opening hours for a specific date
  const getOpeningHours = (club, date) => {
    if (!club || !club.openingHours) return { openingTime: '08:00', closingTime: '22:00' };
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const hoursString = club.openingHours[dayName];
    
    if (!hoursString) return { openingTime: '08:00', closingTime: '22:00' };
    
    const [openingTime, closingTime] = hoursString.split(' - ');
    return { openingTime, closingTime };
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if a slot is in the past
  const isSlotInPast = (slotDate, timeSlot) => {
    const now = new Date();
    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(slotHours, slotMinutes, 0, 0);
    return slotDateTime < now;
  };

  const handleSlotClick = (court, time) => {
    // Check if slot is in the past
    if (isSlotInPast(bookingDate, time)) return;
    
    const policy = selectedClub.bookingPolicy || { minDuration: 60, maxDuration: 90 };
    const minDuration = policy.minDuration;
    const maxDuration = policy.maxDuration;
    const [startH, startM] = time.split(':').map(Number);
    
    // Get opening hours for the selected date
    const { closingTime } = getOpeningHours(selectedClub, bookingDate);
    const closingMinutes = timeToMinutes(closingTime);
    
    // Calculate available consecutive minutes backwards
    let backwardsMinutes = 0;
    let backH = startH;
    let backM = startM;
    for (let i = 30; i <= maxDuration; i += 30) {
      let prevM = backM - 30;
      let prevH = backH;
      if (prevM < 0) {
        prevH -= 1;
        prevM += 60;
      }
      backH = prevH;
      backM = prevM;
      
      const prevTimeStr = `${prevH.toString().padStart(2, '0')}:${prevM.toString().padStart(2, '0')}`;
      if (court.slots.includes(prevTimeStr)) {
        backwardsMinutes += 30;
      } else {
        break;
      }
    }
    
    // Calculate available consecutive minutes forwards
    let availableMinutes = 30; // Current slot
    let currentH = startH;
    let currentM = startM;
    for (let i = 30; i < maxDuration; i += 30) {
      let nextM = currentM + 30;
      let nextH = currentH;
      if (nextM >= 60) {
        nextH += 1;
        nextM -= 60;
      }
      currentH = nextH;
      currentM = nextM;
      
      const nextTimeStr = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
      const nextTimeMinutes = timeToMinutes(nextTimeStr);
      
       // Stop if the slot would extend past closing time
      if (nextTimeMinutes + 30 > closingMinutes) break;
      
      if (court.slots.includes(nextTimeStr)) {
        availableMinutes += 30;
      } else {
        break;
      }
    }
    
    const totalAvailable = availableMinutes + backwardsMinutes;
    const options = [];
    const basePricePerMin = (selectedClub.price || 15.60) / 60; 
    
    // Generate standard options
    for (let d = minDuration; d <= maxDuration; d += 30) {
      if (d <= totalAvailable) {
        options.push({
          duration: d,
          label: `${Math.floor(d/60)} h y ${d%60} min`,
          price: basePricePerMin * d
        });
      }
    }

    const defaultOption = options.find(o => o.duration === minDuration) || options[0];

    if (defaultOption) {
      // Calculate start time based on forward allocation priority
      const forwardAvailable = availableMinutes - 30;
      const forwardAllocation = Math.min(forwardAvailable, defaultOption.duration - 30);
      const remainingNeeded = (defaultOption.duration - 30) - forwardAllocation;
      const backwardAllocation = remainingNeeded > 0 ? Math.min(backwardsMinutes, remainingNeeded) : 0;
      
      // Calculate actual start time
      let actualStartH = startH;
      let actualStartM = startM;
      if (backwardAllocation > 0) {
        actualStartM -= backwardAllocation;
        while (actualStartM < 0) {
          actualStartH -= 1;
          actualStartM += 60;
        }
      }
      const actualStartTime = `${actualStartH.toString().padStart(2, '0')}:${actualStartM.toString().padStart(2, '0')}`;
      
      setSelectedSlot({
        courtId: court.id,
        courtName: court.name,
        time: time,
        clickedTime: time,
        startTime: actualStartTime,
        selectedDuration: defaultOption.duration,
        options: options,
        forwardMinutes: availableMinutes - 30,
        backwardMinutes: backwardsMinutes
      });
    }
  };

  const handleDurationSelect = (duration) => {
    setSelectedSlot(prev => {
      // Recalculate start time based on new duration
      const [clickH, clickM] = prev.clickedTime.split(':').map(Number);
      const forwardAvailable = prev.forwardMinutes;
      const forwardAllocation = Math.min(forwardAvailable, duration - 30);
      const remainingNeeded = (duration - 30) - forwardAllocation;
      const backwardAllocation = remainingNeeded > 0 ? Math.min(prev.backwardMinutes, remainingNeeded) : 0;
      
      let actualStartH = clickH;
      let actualStartM = clickM;
      if (backwardAllocation > 0) {
        actualStartM -= backwardAllocation;
        while (actualStartM < 0) {
          actualStartH -= 1;
          actualStartM += 60;
        }
      }
      const actualStartTime = `${actualStartH.toString().padStart(2, '0')}:${actualStartM.toString().padStart(2, '0')}`;
      
      return {
        ...prev,
        selectedDuration: duration,
        startTime: actualStartTime
      };
    });
  };

  const handleClosePopover = () => {
    setSelectedSlot(null);
  };

  const handleSlotMouseEnter = (courtId, time) => {
    // Don't hover on past slots
    if (isSlotInPast(bookingDate, time)) {
      setHoveredSlot(null);
      return;
    }
    
    const court = selectedClub.courts.find(c => c.id === courtId);
    if (!court) {
        setHoveredSlot({ courtId, time, availableMinutes: 30, backwardsMinutes: 0 });
        return;
    }

    const policy = selectedClub.bookingPolicy || { minDuration: 60, maxDuration: 120 };
    const maxDuration = policy.maxDuration;
    const [startH, startM] = time.split(':').map(Number);

    // Get opening hours for the selected date
    const { closingTime } = getOpeningHours(selectedClub, bookingDate);
    const closingMinutes = timeToMinutes(closingTime);

    // Count backwards
    let backwardsMinutes = 0;
    let backH = startH;
    let backM = startM;
    for (let i = 30; i <= maxDuration; i += 30) {
       let prevM = backM - 30;
       let prevH = backH;
       if (prevM < 0) {
         prevH -= 1;
         prevM += 60;
       }
       backH = prevH;
       backM = prevM;
       
       const prevTimeStr = `${prevH.toString().padStart(2, '0')}:${prevM.toString().padStart(2, '0')}`;
       if (court.slots.includes(prevTimeStr)) {
         backwardsMinutes += 30;
       } else {
         break;
       }
    }

    // Count forwards
    let availableMinutes = 30; // Current slot
    let currentH = startH;
    let currentM = startM;
    for (let i = 30; i < maxDuration; i += 30) {
       let nextM = currentM + 30;
       let nextH = currentH;
       if (nextM >= 60) {
         nextH += 1;
         nextM -= 60;
       }
       currentH = nextH;
       currentM = nextM;
       
       const nextTimeStr = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
       const nextTimeMinutes = timeToMinutes(nextTimeStr);
       
       // Stop if the slot would extend past closing time
       if (nextTimeMinutes + 30 > closingMinutes) break;
       
       if (court.slots.includes(nextTimeStr)) {
         availableMinutes += 30;
       } else {
         break;
       }
    }
    setHoveredSlot({ courtId, time, availableMinutes, backwardsMinutes });
  };

  const handleSlotMouseLeave = () => {
    setHoveredSlot(null);
  };

  const checkBookability = (court, timeSlot) => {
    const policy = selectedClub.bookingPolicy || { minDuration: 60, maxDuration: 120 };
    const minDuration = policy.minDuration;
    
    if (!court.slots.includes(timeSlot)) return false;
    
    // Check if slot is in the past
    if (isSlotInPast(bookingDate, timeSlot)) return false;
    
    if (minDuration <= 30) return true;

    // Get opening hours for the selected date
    const { closingTime } = getOpeningHours(selectedClub, bookingDate);
    const closingMinutes = timeToMinutes(closingTime);

    // Count consecutive slots backwards and forwards
    const [startH, startM] = timeSlot.split(':').map(Number);
    let totalConsecutive = 30; // Current slot
    
    // Check backwards
    let backH = startH;
    let backM = startM;
    for (let i = 30; i < minDuration && totalConsecutive < minDuration; i += 30) {
       let prevM = backM - 30;
       let prevH = backH;
       if (prevM < 0) {
         prevH -= 1;
         prevM += 60;
       }
       backH = prevH;
       backM = prevM;
       
       const prevTimeStr = `${prevH.toString().padStart(2, '0')}:${prevM.toString().padStart(2, '0')}`;
       if (court.slots.includes(prevTimeStr)) {
         totalConsecutive += 30;
       } else {
         break;
       }
    }
    
    // Check forwards if still needed
    if (totalConsecutive < minDuration) {
      let fwdH = startH;
      let fwdM = startM;
      for (let i = 30; i < minDuration && totalConsecutive < minDuration; i += 30) {
         let nextM = fwdM + 30;
         let nextH = fwdH;
         if (nextM >= 60) {
           nextH += 1;
           nextM -= 60;
         }
         fwdH = nextH;
         fwdM = nextM;
         
         const nextTimeStr = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
         const nextTimeMinutes = timeToMinutes(nextTimeStr);
         
         // Stop if the slot would extend past closing time
         if (nextTimeMinutes + 30 > closingMinutes) break;
         
         if (court.slots.includes(nextTimeStr)) {
           totalConsecutive += 30;
         } else {
           break;
         }
      }
    }
    
    return totalConsecutive >= minDuration;
  };

  // Helper function to get available slots for club search view
  const getAvailableSlots = (club) => {
    const now = new Date();
    const policy = club.bookingPolicy || { minDuration: 60, maxDuration: 120 };
    const minDuration = policy.minDuration;
    
    // Get all unique slots from all courts
    const allSlots = [...new Set(club.courts.flatMap(court => court.slots))];
    
    // Filter slots that are bookable
    const bookableSlots = allSlots.filter(slot => {
      // Check if slot is in the past (using current date/time)
      const [slotHours, slotMins] = slot.split(':').map(Number);
      const slotDateTime = new Date();
      slotDateTime.setHours(slotHours, slotMins, 0, 0);
      
      // If slot is in the past, exclude it
      if (slotDateTime < now) return false;
      
      // Get opening hours (using today's date for simplicity)
      const { closingTime } = club.openingHours ? 
        getOpeningHours(club, new Date()) : 
        { closingTime: '22:00' };
      const closingMinutes = timeToMinutes(closingTime);
      
      // Calculate the end time if minDuration is booked from this slot
      const slotMinutes = slotHours * 60 + slotMins;
      const endTimeMinutes = slotMinutes + minDuration;
      
      // If the booking would extend past closing time, exclude this slot
      if (endTimeMinutes > closingMinutes) return false;
      
      // Check if at least one court can accommodate this slot with min duration
      return club.courts.some(court => {
        if (!court.slots.includes(slot)) return false;
        
        // If minDuration is 30 or less, any available slot is bookable
        if (minDuration <= 30) return true;
        
        // Count consecutive slots backwards and forwards
        const [startH, startM] = slot.split(':').map(Number);
        let totalConsecutive = 30; // Current slot
        
        // Check backwards
        let backH = startH;
        let backM = startM;
        for (let i = 30; i < minDuration && totalConsecutive < minDuration; i += 30) {
           let prevM = backM - 30;
           let prevH = backH;
           if (prevM < 0) {
             prevH -= 1;
             prevM += 60;
           }
           backH = prevH;
           backM = prevM;
           
           const prevTimeStr = `${prevH.toString().padStart(2, '0')}:${prevM.toString().padStart(2, '0')}`;
           if (court.slots.includes(prevTimeStr)) {
             totalConsecutive += 30;
           } else {
             break;
           }
        }
        
        // Check forwards if still needed
        if (totalConsecutive < minDuration) {
          let fwdH = startH;
          let fwdM = startM;
          for (let i = 30; i < minDuration && totalConsecutive < minDuration; i += 30) {
             let nextM = fwdM + 30;
             let nextH = fwdH;
             if (nextM >= 60) {
               nextH += 1;
               nextM -= 60;
             }
             fwdH = nextH;
             fwdM = nextM;
             
             const nextTimeStr = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
             const nextTimeMinutes = timeToMinutes(nextTimeStr);
             
             // Stop if the slot would extend past closing time
             if (nextTimeMinutes + 30 > closingMinutes) break;
             
             if (court.slots.includes(nextTimeStr)) {
               totalConsecutive += 30;
             } else {
               break;
             }
          }
        }
        
        return totalConsecutive >= minDuration;
      });
    });
    
    return bookableSlots.sort();
  };

  const isSlotInHoverRange = (courtId, slotTime) => {
    if (!hoveredSlot || hoveredSlot.courtId !== courtId) return false;
    
    const [h1, m1] = hoveredSlot.time.split(':').map(Number);
    const [h2, m2] = slotTime.split(':').map(Number);
    
    const hoveredMins = h1 * 60 + m1;
    const currentMins = h2 * 60 + m2;
    
    const policy = selectedClub?.bookingPolicy || { minDuration: 60 };
    const totalAvailable = hoveredSlot.availableMinutes + hoveredSlot.backwardsMinutes;
    
    if (totalAvailable < policy.minDuration) {
        return false;
    }
    
    // Calculate highlight range: prioritize 90 mins, limited by availability
    let targetDuration = 90;
    if (totalAvailable < targetDuration) {
        targetDuration = totalAvailable;
    }
    
    // Prioritize forward allocation
    const forwardAvailable = hoveredSlot.availableMinutes - 30; // Exclude hovered slot itself
    const forwardAllocation = Math.min(forwardAvailable, targetDuration - 30);
    const remainingNeeded = (targetDuration - 30) - forwardAllocation;
    
    // Only go backwards if needed
    const backwardAllocation = remainingNeeded > 0 ? Math.min(hoveredSlot.backwardsMinutes, remainingNeeded) : 0;
    
    const rangeStart = hoveredMins - backwardAllocation;
    const rangeEnd = hoveredMins + 30 + forwardAllocation;
    
    return currentMins >= rangeStart && currentMins < rangeEnd;
  };

  const isSlotInSelectedRange = (courtId, slotTime) => {
    if (!selectedSlot || selectedSlot.courtId !== courtId) return false;
    
    const [h1, m1] = selectedSlot.time.split(':').map(Number);
    const [h2, m2] = slotTime.split(':').map(Number);
    
    const selectedMins = h1 * 60 + m1;
    const currentMins = h2 * 60 + m2;
    
    const duration = selectedSlot.selectedDuration;
    
    // Prioritize forward allocation
    const forwardAvailable = selectedSlot.forwardMinutes;
    const forwardAllocation = Math.min(forwardAvailable, duration - 30);
    const remainingNeeded = (duration - 30) - forwardAllocation;
    
    // Only go backwards if needed
    const backwardAllocation = remainingNeeded > 0 ? Math.min(selectedSlot.backwardMinutes, remainingNeeded) : 0;
    
    const rangeStart = selectedMins - backwardAllocation;
    const rangeEnd = selectedMins + 30 + forwardAllocation;
    
    return currentMins >= rangeStart && currentMins < rangeEnd;
  };

  // Drag scroll functionality
  useEffect(() => {
    const containers = Object.values(scrollContainerRefs.current);
    
    containers.forEach(container => {
      if (!container) return;
      
      let isDown = false;
      let startX;
      let scrollLeft;

      const handleMouseDown = (e) => {
        isDown = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      };

      const handleMouseLeave = () => {
        isDown = false;
        container.style.cursor = 'grab';
      };

      const handleMouseUp = () => {
        isDown = false;
        container.style.cursor = 'grab';
      };

      const handleMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        container.scrollLeft = scrollLeft - walk;
      };

      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mouseleave', handleMouseLeave);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mousemove', handleMouseMove);

      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mousemove', handleMouseMove);
      };
    });
  }, [view]);

  // Extended Mock Data for Search
  const allClubs = [
    {
      id: 1,
      name: "Club de pádel La Via",
      distance: 0.5,
      price: 20,
      level: "Intermedio",
      image: "https://media.pistaenjuego.ovh/images/center/3/1/2/l.sanlucar-padel-club-1_1411416213.jpg",
      location: "Av. Al-Andalus, 123, 11540 Sanlúcar de Barrameda, Cádiz",
      bookingPolicy: {
        minDuration: 60,
        maxDuration: 120
      },
      description: "Somos el primer club de padel en el centro de Sanlúcar de Barrameda con 6 pistas de cristal panorámicas. Contamos con profesores certificados, vestuarios de lujo y una zona social con cafetería y tienda especializada.",
      amenities: ["Acceso Minusválidos", "Alquiler Material", "Parking Gratuito", "Tienda", "Cafetería", "Vestuarios", "Taquillas", "WiFi", "Gimnasio"],
      galleryImages: [
        "https://polideportivolarraona.org/wp-content/uploads/2024/03/origen-padel.jpg",
        "https://swisspadel.ch/wp-content/uploads/2024/07/DSC01134-1-2048x1366.jpg",
        "https://skypadel.com/wp-content/uploads/2023/05/pista-pro-padel-league-2-1-1080x675.jpg",
      ],
      openingHours: {
        monday: "13:00 - 21:00",
        tuesday: "09:00 - 23:00",
        wednesday: "09:00 - 23:00",
        thursday: "09:00 - 23:00",
        friday: "09:00 - 23:00",
        saturday: "09:00 - 22:00",
        sunday: "09:00 - 22:00"
      },
      courts: [
        { id: 'c1', name: 'Pista Central', type: 'glass', slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00','22:30'] },
        { id: 'c2', name: 'Pista 2', type: 'wall', slots: ['09:00', '09:30', '17:00'] },
        { id: 'c3', name: 'Pista 3', type: 'glass', slots: ['10:00', '11:00', '18:00'] },
        { id: 'c4', name: 'Pista 4', type: 'glass', slots: ['09:00', '10:00', '11:00', '12:00'] }
      ]
    },
    {
      id: 2,
      name: "El Moral",
      distance: 5.1,
      price: 15,
      level: "Avanzado",
      image: "https://www.padelelmoral.com/graf/fondo/movil/imagen_02.jpg",
      location: "Camino del Pino de la Jara, 2, 11540 Sanlúcar de Barrameda, Cádiz",
      description: "Club exclusivo en un entorno natural privilegiado. Ideal para desconectar y disfrutar del deporte al aire libre.",
      amenities: ["Parking", "Restaurante", "Piscina", "Gimnasio"],
      openingHours: {
        monday: "08:00 - 22:00",
        weekend: "09:00 - 21:00"
      },
      courts: [
        { id: 'c3', name: 'Pista Azul', type: 'glass', slots: ['18:00','18:30','19:00','19:30','20:00'] }
      ]
    },
    {
      id: 3,
      name: "Club de Padel Puerto Sherry",
      distance: 3.2,
      price: 25,
      level: "Avanzado",
      image: "https://www.puertosherry.com/wp-content/uploads/2021/07/Puertosherry_actividades_clubpadel_1.jpeg",
      location: "Av. de la Libertad, S/N, 11500 El Puerto de Sta María, Cádiz",
      description: "Las mejores instalaciones indoor de la zona norte. Climatización perfecta todo el año.",
      amenities: ["Indoor", "Climatizado", "Bar", "Tienda Pro"],
      openingHours: {
        monday: "13:00 - 21:00",
        tuesday: "09:00 - 23:00",
        wednesday: "09:00 - 23:00",
        thursday: "09:00 - 23:00",
        weekend: "09:00 - 22:00"
        },
        bookingPolicy: {
        minDuration: 30,
        maxDuration: 120
      },
      courts: [
        { id: 'c4', name: 'Pista 1', type: 'glass', slots: ['10:00', '12:00','12:30', '14:00'] },
        { id: 'c5', name: 'Pista 2', type: 'glass', slots: ['16:00', '18:00'] }
      ]
    },
    {
      id: 4,
      name: "Club de Pádel Nuevo Jacaranda",
      distance: 8.5,
      price: 12,
      level: "Intermedio",
      bookingPolicy: {
        minDuration: 90,
        maxDuration: 120
      },
      openingHours: {
        monday: "07:00 - 23:00",
        weekend: "08:00 - 22:00"
      },
      image: "https://www.gestecosl.com/wp-content/uploads/2021/03/jacaranda-padel-gesteco-15.png",
      location: "Av. del Altillo, S/N, 11405 Jerez de la Frontera, Cádiz",
      courts: [
        { id: 'c6', name: 'Muro 1', type: 'wall', slots: ['09:00','09:30','10:00', '10:30', '12:00','21:00','21:30','22:00','22:30'] }
      ]
    }
  ];

  // Filter Logic
  const getFilteredClubs = () => {
    let filtered = allClubs.filter(club => {
      // Search Query
      if (filters.searchQuery && !club.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      // Check if club has at least one court of the selected type
      if (filters.courtType !== 'all') {
        const hasCourtType = club.courts.some(c => c.type === filters.courtType);
        if (!hasCourtType) return false;
      }
      // Time range filtering would go here (checking slots against timeStart/End)
      if (filters.timeStart && filters.timeEnd) {
         const formatTime = (date) => {
           if (!date) return '';
           const hours = date.getHours().toString().padStart(2, '0');
           const minutes = date.getMinutes().toString().padStart(2, '0');
           return `${hours}:${minutes}`;
         };
         const start = formatTime(filters.timeStart);
         const end = formatTime(filters.timeEnd);

         const hasSlotInRange = club.courts.some(c => c.slots.some(slot => slot >= start && slot <= end));
         if (!hasSlotInRange) return false;
      }
      return true;
    });

    // Sorting Logic
    filtered.sort((a, b) => {
      // 1. Level Priority (Exact match > +/- 1 level > others)
      // Simplified level mapping: Principiante=1, Intermedio=2, Avanzado=3
      const levels = { "Principiante": 1, "Intermedio": 2, "Avanzado": 3 };
      const userLvlVal = levels[userLevel];
      const aLvlVal = levels[a.level];
      const bLvlVal = levels[b.level];

      const aDiff = Math.abs(userLvlVal - aLvlVal);
      const bDiff = Math.abs(userLvlVal - bLvlVal);

      if (aDiff !== bDiff) return aDiff - bDiff;

      // 2. Secondary Sort
      if (filters.sortBy === 'price') return a.price - b.price;
      return a.distance - b.distance;
    });

    return filtered;
  };

  // Get recommended clubs (3 closest clubs)
  const recommendedClubs = [...allClubs]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(club => ({
      id: club.id,
      name: club.name,
      distance: `${club.distance} km`,
      rating: 4.8, // Mock rating, podría venir de los datos del club
      image: club.image,
      location: club.location
    }));

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo" onClick={() => {
            setView('dashboard');
            onNavigate('home');
          }}>
            <img src="/padelup_logo2.png" alt="PadelUp Logo" className="logo-img" />
          </div>
          <ul className="nav-menu">
            <li 
              className="nav-item dropdown"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <span>Aprende</span>
              <img src={dropdownArrow} alt="" className="dropdown-arrow" />
              {showDropdown && (
                <ul className="dropdown-menu">
                  <li className="dropdown-item">Niveles</li>
                  <li className="dropdown-item">Entrenadores</li>
                  <li className="dropdown-item">Horarios</li>
                </ul>
              )}
            </li>
            <li className="nav-item" onClick={() => setView('club-search')}>Reserva</li>
            <li className="nav-item">Partidos</li>
          </ul>
        </div>

        <div className="navbar-right">
           {/* 2. BOTÓN MI CUENTA: Ahora cambia la vista a 'profile' */}
          <button 
                className={`user-account-btn ${view === 'profile' ? 'active' : ''}`}
                onClick={() => setView('profile')}
          >
              <div className="user-avatar">
                  {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>Mi Cuenta</span>
          </button>
        </div>
      </nav>

      {/* VISTA 1: DASHBOARD */}
      <main className="dashboard-content">
        <div key={view} className="view-transition">
        {view === 'dashboard' ? (
          <>
            {/* Recommended Clubs Section */}
            <section className="dashboard-section fade-in">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Clubs Recomendados</h2>
                  <p className="section-subtitle">Las mejores pistas cerca de ti</p>
                </div>
                <button className="btn-see-all" onClick={() => setView('club-search')}>
                  Ver todo →
                </button>
              </div>
              
              <div className="cards-grid">
                {recommendedClubs.map(club => (
                  <div key={club.id} className="club-card" onClick={() => handleClubClick(club)}>
                    <div className="card-image-wrapper">
                      <img src={club.image} alt={club.name} className="card-image" />
                      <span className="distance-badge">{club.distance}</span>
                    </div>
                    <div className="card-content">
                      <div className="card-header-row">
                        <h3 className="card-title">{club.name}</h3>
                        <div className="rating">
                          <span>★</span> {club.rating}
                        </div>
                      </div>
                      <p className="card-location">{club.location}</p>
                      <button className="card-action-btn">Reservar</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
          /* VISTA 2: PERFIL DE USUARIO (NUEVA) */
        ) : view === 'profile' ? (
            <section className="profile-section fade-in" style={{padding: '2rem', maxWidth: '800px', margin: '0 auto'}}>
                <h2 className="section-title" style={{marginBottom: '2rem'}}>Mi Perfil</h2>
                
                {currentUser ? (
                    <div className="profile-card" style={{
                        backgroundColor: 'white', 
                        borderRadius: '16px', 
                        padding: '2rem', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem'}}>
                            <div style={{
                                width: '80px', height: '80px', 
                                backgroundColor: '#111827', color: 'white', 
                                borderRadius: '50%', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', 
                                fontSize: '2rem', fontWeight: 'bold'
                            }}>
                                {currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem'}}>
                                    {currentUser.nombre} {currentUser.apellidos}
                                </h3>
                                <p style={{color: '#6b7280'}}>Usuario: {currentUser.udni}</p>
                            </div>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
                            
                            {/* Tarjeta Monedero */}
                            <div style={{
                                padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb',
                                backgroundColor: '#f9fafb'
                            }}>
                                <span style={{display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>Monedero</span>
                                <div style={{fontSize: '1.5rem', fontWeight: '600', color: '#059669'}}>
                                    {currentUser.monedero ? parseFloat(currentUser.monedero).toFixed(2) : '0.00'} €
                                </div>
                            </div>

                            {/* Tarjeta Valoración */}
                            <div style={{
                                padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb',
                                backgroundColor: '#f9fafb'
                            }}>
                                <span style={{display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>Valoración</span>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    <span style={{fontSize: '1.5rem', fontWeight: '600'}}>
                                        {currentUser.valoracion || '0.0'}
                                    </span>
                                    <span style={{color: '#FBBF24', fontSize: '1.5rem'}}>★</span>
                                </div>
                            </div>

                             {/* Tarjeta Nivel (Opcional si lo añadiste al backend) */}
                            <div style={{
                                padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb',
                                backgroundColor: '#f9fafb'
                            }}>
                                <span style={{display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>Nivel de Juego</span>
                                <div style={{fontSize: '1.25rem', fontWeight: '600'}}>
                                    {currentUser.nivel_de_juego || 'Sin clasificar'}
                                </div>
                            </div>
                        </div>

                        <div style={{marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '2rem'}}>
                            <button 
                                onClick={handleLogout}
                                style={{
                                    padding: '0.75rem 1.5rem', 
                                    backgroundColor: '#ef4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    fontWeight: '500', 
                                    cursor: 'pointer'
                                }}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{textAlign: 'center', padding: '3rem'}}>
                        <p>No se ha encontrado información del usuario. Por favor inicia sesión de nuevo.</p>
                        <button onClick={handleLogout} className="btn-primary">Ir al Login</button>
                    </div>
                )}
            </section>
        ) : view === 'club-details' && selectedClub ? (
          /* Club Details View */
          <section className="club-details-section fade-in">
            {/* Header with Image */}
            <div className="club-details-header" style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${selectedClub.image})`}}>
              <div className="club-header-content">
                <h1 className="club-big-title">{selectedClub.name}</h1>
              </div>
            </div>

            <div className="club-details-container">
              {/* Breadcrumbs */}
              <div className="breadcrumbs">
                <span onClick={() => setView('dashboard')}>Home</span> 
                <span className="separator">/</span>
                <span onClick={() => setView('club-search')}>Clubs</span>
                <span className="separator">/</span>
                <span className="current">{selectedClub.name}</span>
              </div>

              <div className="club-details-grid-layout">
                {/* Left Column: Booking Grid */}
                <div className="booking-section">
                  <div className="date-navigation">
                    <div className="date-controls">
                      <button className="nav-arrow" onClick={() => handleDateChange(subDays(bookingDate, 1), 'left')}>‹</button>
                      <span className={`current-date ${dateTransitioning ? `slide-out-${dateDirection}` : `slide-in-${dateDirection}`}`}>
                        {format(bookingDate, 'EEE, d MMM', { locale: es })}
                      </span>
                      <button className="nav-arrow" onClick={() => handleDateChange(addDays(bookingDate, 1), 'right')}>›</button>
                    </div>
                  </div>
                  
                  <div className="booking-grid-wrapper">
                    {(() => {
                      // Get opening hours for the selected date
                      const { openingTime, closingTime } = getOpeningHours(selectedClub, bookingDate);
                      const openingHour = parseInt(openingTime.split(':')[0]);
                      const closingHour = parseInt(closingTime.split(':')[0]);
                      const hourCount = closingHour - openingHour;
                      
                      return (
                        <table className="booking-grid">
                          <thead>
                            <tr>
                              <th className="court-header">Pista</th>
                              {[...Array(hourCount)].map((_, i) => {
                                const hour = i + openingHour;
                                return <th key={hour}>{hour}</th>;
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedClub.courts.map(court => (
                              <tr key={court.id}>
                                <td className="court-name-cell">
                                  <div className="court-name">{court.name}</div>
                                  <div className="court-type">{court.type === 'glass' ? 'Cristal' : 'Muro'}</div>
                                </td>
                                {[...Array(hourCount)].map((_, i) => {
                              const hour = i + openingHour;
                              const timeSlotFull = `${hour.toString().padStart(2, '0')}:00`;
                              const timeSlotHalf = `${hour.toString().padStart(2, '0')}:30`;
                              
                              // Check bookability (availability + minimum duration)
                              const isBookableFull = checkBookability(court, timeSlotFull);
                              const isBookableHalf = checkBookability(court, timeSlotHalf);
                              
                              const isHoveredFull = isSlotInHoverRange(court.id, timeSlotFull);
                              const isHoveredHalf = isSlotInHoverRange(court.id, timeSlotHalf);
                              
                              const isSelectedFull = isSlotInSelectedRange(court.id, timeSlotFull);
                              const isSelectedHalf = isSlotInSelectedRange(court.id, timeSlotHalf);

                              return (
                                <td key={hour} className="slot-cell-container" style={{position: 'relative'}}>
                                  <div className="slot-cell-split">
                                    <div 
                                      className={`half-slot ${isBookableFull ? 'available' : 'unavailable'} ${isHoveredFull ? 'hover-highlight' : ''} ${isSelectedFull ? 'selected-highlight' : ''}`}
                                      onClick={(e) => isBookableFull && handleSlotClick(court, timeSlotFull, e)}
                                      onMouseEnter={() => isBookableFull && handleSlotMouseEnter(court.id, timeSlotFull)}
                                      onMouseLeave={handleSlotMouseLeave}
                                    ></div>
                                    <div 
                                      className={`half-slot ${isBookableHalf ? 'available' : 'unavailable'} ${isHoveredHalf ? 'hover-highlight' : ''} ${isSelectedHalf ? 'selected-highlight' : ''}`}
                                      onClick={(e) => isBookableHalf && handleSlotClick(court, timeSlotHalf, e)}
                                      onMouseEnter={() => isBookableHalf && handleSlotMouseEnter(court.id, timeSlotHalf)}
                                      onMouseLeave={handleSlotMouseLeave}
                                    ></div>
                                  </div>
                                  {selectedSlot && selectedSlot.courtId === court.id && selectedSlot.time === timeSlotFull && (
                                    <div className="slot-popover-inline">
                                      <div className="popover-header">
                                        <h4>{selectedSlot.courtName}</h4>
                                        <span className="popover-time">{selectedSlot.startTime}</span>
                                      </div>
                                      
                                      <div className="popover-duration-selector">
                                        {selectedSlot.options.map(option => (
                                          <div 
                                            key={option.duration}
                                            className={`duration-option ${selectedSlot.selectedDuration === option.duration ? 'selected' : ''}`}
                                            onClick={() => handleDurationSelect(option.duration)}
                                          >
                                            <span>{option.label}</span>
                                            <span className="duration-price">{option.price.toFixed(2).replace('.', ',')} €</span>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <button className="popover-continue-btn">
                                        Continuar - {selectedSlot.options.find(o => o.duration === selectedSlot.selectedDuration).price.toFixed(2).replace('.', ',')} €
                                      </button>
                                      
                                      <button className="popover-close-btn" onClick={handleClosePopover}>
                                        Cerrar
                                      </button>
                                    </div>
                                  )}
                                  {selectedSlot && selectedSlot.courtId === court.id && selectedSlot.time === timeSlotHalf && (
                                    <div className="slot-popover-inline">
                                      <div className="popover-header">
                                        <h4>{selectedSlot.courtName}</h4>
                                        <span className="popover-time">{selectedSlot.startTime}</span>
                                      </div>
                                      
                                      <div className="popover-duration-selector">
                                        {selectedSlot.options.map(option => (
                                          <div 
                                            key={option.duration}
                                            className={`duration-option ${selectedSlot.selectedDuration === option.duration ? 'selected' : ''}`}
                                            onClick={() => handleDurationSelect(option.duration)}
                                          >
                                            <span>{option.label}</span>
                                            <span className="duration-price">{option.price.toFixed(2).replace('.', ',')} €</span>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <button className="popover-continue-btn">
                                        Continuar - {selectedSlot.options.find(o => o.duration === selectedSlot.selectedDuration).price.toFixed(2).replace('.', ',')} €
                                      </button>
                                      
                                      <button className="popover-close-btn" onClick={handleClosePopover}>
                                        Cerrar
                                      </button>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                      );
                    })()}
                  </div>
                  
                  <div className="legend">
                    <div className="legend-item"><span className="box available"></span> Disponible</div>
                    <div className="legend-item"><span className="box unavailable"></span> No disponible</div>
                    <div className="legend-item"><span className="box selected"></span> Tu reserva</div>
                  </div>
                </div>

                {/* Right Column: Info */}
                <div className="club-info-sidebar">
                  <div className="map-card">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedClub.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="160"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación del club"
                    ></iframe>
                    <div className="map-address">
                      {selectedClub.location}
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <h3>Servicios</h3>
                    <div className="amenities-tags">
                      {selectedClub.amenities?.map(amenity => (
                        <span key={amenity} className="amenity-tag">{amenity}</span>
                      )) || <span className="no-info">Información no disponible</span>}
                    </div>
                  </div>

                  <div className="info-card">
                    <h3>Horario</h3>
                    <div className="opening-hours-list">
                      {selectedClub.openingHours ? Object.entries(selectedClub.openingHours).map(([day, hours]) => {
                        const daysInSpanish = {
                          'monday': 'Lunes',
                          'tuesday': 'Martes',
                          'wednesday': 'Miércoles',
                          'thursday': 'Jueves',
                          'friday': 'Viernes',
                          'saturday': 'Sábado',
                          'sunday': 'Domingo',
                          'weekend': 'Fin de semana'
                        };
                        const dayName = daysInSpanish[day] || day.charAt(0).toUpperCase() + day.slice(1);
                        return (
                          <div key={day} className="hour-row">
                            <span className="day-name">{dayName}</span>
                            <span className="hours-val">{hours}</span>
                          </div>
                        );
                      }) : <p>Horario no disponible</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="club-description-section">
                <h3>Sobre {selectedClub.name}</h3>
                <p>{selectedClub.description || "No hay descripción disponible para este club."}</p>
                
                {/* Image Gallery Carousel */}
                {selectedClub.galleryImages && selectedClub.galleryImages.length > 0 && (
                  <div className="club-gallery-carousel">
                    <div className="carousel-image-container">
                      {selectedClub.galleryImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${selectedClub.name} - Imagen ${index + 1}`}
                          className={`carousel-image ${index === currentImageIndex ? 'active' : ''}`}
                        />
                      ))}
                      <button 
                        className="carousel-nav-btn carousel-nav-prev"
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === 0 ? selectedClub.galleryImages.length - 1 : prev - 1
                        )}
                        aria-label="Imagen anterior"
                      >
                        ‹
                      </button>
                      <button 
                        className="carousel-nav-btn carousel-nav-next"
                        onClick={() => setCurrentImageIndex((prev) => 
                          (prev + 1) % selectedClub.galleryImages.length
                        )}
                        aria-label="Imagen siguiente"
                      >
                        ›
                      </button>
                    </div>
                    <div className="carousel-indicators">
                      {selectedClub.galleryImages.map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* Club Search View */
          <section className="club-search-section fade-in">
            <div className="search-header">
              <button className="btn-back" onClick={() => setView('dashboard')}>← Volver</button>
              <h2 className="section-title">Buscar Pistas</h2>
            </div>

            {/* Filters Bar */}
            <div className="filters-container">
              <div className="search-bar-container">
                <input 
                  type="text" 
                  placeholder="Buscar club por nombre..." 
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                  className="search-input"
                />
              </div>

              <div className="primary-filters">
                <div className="filter-group">
                  <label>Fecha</label>
                  <DatePicker
                    selected={filters.date}
                    onChange={(date) => setFilters({...filters, date})}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    className="filter-input"
                    minDate={new Date()}
                  />
                </div>
                <div className="filter-group">
                  <label>Hora Inicio</label>
                  <DatePicker
                    selected={filters.timeStart}
                    onChange={(date) => setFilters({...filters, timeStart: date})}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={30}
                    timeCaption="Hora"
                    dateFormat="HH:mm"
                    locale="es"
                    className="filter-input"
                    placeholderText="--:--"
                    isClearable
                  />
                </div>
                <div className="filter-group">
                  <label>Hora Fin</label>
                  <DatePicker
                    selected={filters.timeEnd}
                    onChange={(date) => setFilters({...filters, timeEnd: date})}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={30}
                    timeCaption="Hora"
                    dateFormat="HH:mm"
                    locale="es"
                    className="filter-input"
                    placeholderText="--:--"
                    isClearable
                  />
                </div>
                
                <button 
                  className={`btn-filter-toggle ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                  </svg>
                  Filtrar
                </button>

                <div className="filter-group">
                  <label>Ordenar por</label>
                  <Select
                    value={sortOptions.find(option => option.value === filters.sortBy)}
                    onChange={(option) => setFilters({...filters, sortBy: option.value})}
                    options={sortOptions}
                    styles={customSelectStyles}
                    isSearchable={false}
                  />
                </div>
              </div>

              {showFilters && (
                <div className="secondary-filters fade-in">
                  <div className="filter-group">
                    <label>Pista</label>
                    <Select
                      value={courtOptions.find(option => option.value === filters.courtType)}
                      onChange={(option) => setFilters({...filters, courtType: option.value})}
                      options={courtOptions}
                      styles={customSelectStyles}
                      isSearchable={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results List */}
            <div className="search-results">
              {getFilteredClubs().map(club => (
                <div key={club.id} className="search-club-card" onClick={() => handleClubClick(club)}>
                  <div className="search-club-image">
                    <img src={club.image} alt={club.name} />
                    <div className="search-club-badges">
                      <span className="badge-level">{club.level}</span>
                    </div>
                  </div>
                  <div className="search-club-info">
                    <div className="search-club-header">
                      <h3>{club.name}</h3>
                      <span className="price-tag">desde {club.price}€</span>
                    </div>
                    <p className="location-text">{club.location} • {club.distance} km</p>
                    
                    <div className="available-slots-section">
                      <h4>Horarios Disponibles:</h4>
                      <div 
                        className="available-slots-container"
                        ref={el => scrollContainerRefs.current[club.id] = el}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {getAvailableSlots(club).map(slot => (
                          <button key={slot} className="time-slot" onClick={(e) => e.stopPropagation()}>{slot}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>

      {/* Footer Section */}

      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo-container">
                <img src="/padelup_logo2.png" alt="PadelUp Logo" className="footer-logo-img" />
                <span className="footer-logo-text">PadelUp</span>
              </div>
              <p className="footer-description">
                PadelUp permite a los jugadores transformar su juego, haciendo que la reserva de pistas y la búsqueda de compañeros sea más fácil de compartir, entender y actuar.
              </p>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.535c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Producto</h4>
                <ul>
                  <li><a href="#">Características</a></li>
                  <li><a href="#">Precios</a></li>
                  <li><a href="#">Integraciones</a></li>
                  <li><a href="#">Novedades</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Recursos</h4>
                <ul>
                  <li><a href="#">Documentación</a></li>
                  <li><a href="#">Tutoriales</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Soporte</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Compañía</h4>
                <ul>
                  <li><a href="#">Sobre nosotros</a></li>
                  <li><a href="#">Empleo</a></li>
                  <li><a href="#">Contacto</a></li>
                  <li><a href="#">Partners</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2025 PadelUp. Todos los derechos reservados.
            </div>
            <div className="footer-legal">
              <a href="#">Política de Privacidad</a>
              <a href="#">Términos de Servicio</a>
              <a href="#">Configuración de Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
