export const filterFacilities = (facilities, filters) => {
  let data = [...facilities];
  const { query, sport, selectedProvince, selectedDistrict, quick } = filters;

  // Filter by search query
  if (query.trim()) {
    const q = query.toLowerCase();
    data = data.filter(x => 
      x.name.toLowerCase().includes(q) || 
      x.district.toLowerCase().includes(q) || 
      x.city.toLowerCase().includes(q)
    );
  }

  // Filter by sport
  if (sport !== "Tất cả") {
    data = data.filter(x => x.sport === sport);
  }

  // Filter by province
  if (selectedProvince) {
    data = data.filter(x => x.city === selectedProvince);
  }

  // Filter by district
  if (selectedDistrict) {
    data = data.filter(x => x.district === selectedDistrict);
  }

  // Sort by quick filter
  if (quick === "top") {
    data.sort((a, b) => b.rating - a.rating);
  } else if (quick === "cheap") {
    data.sort((a, b) => a.price - b.price);
  } else {
    // recent - sort by id descending
    data.sort((a, b) => b.id - a.id);
  }

  return data;
};

