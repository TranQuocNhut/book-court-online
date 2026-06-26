import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Coffee, Utensils, Club, Trash2, Loader2 } from "lucide-react"; 
import { serviceApi } from "../../../../api/serviceApi";
import { categoryApi } from "../../../../api/categoryApi";
import { toast } from "react-toastify";

// Map icon
const CATEGORY_ICONS = {
  cat_drinks: <Coffee size={18} />,
  cat_snacks: <Utensils size={18} />,
  cat_rentals: <Club size={18} />,
};

// Map service type from database to category id
const TYPE_TO_CATEGORY = {
  DRINK: "cat_drinks",
  FOOD: "cat_snacks",
  EQUIPMENT: "cat_rentals",
};

const CourtServiceModal = ({ isOpen, onClose, court, onSave }) => {
  const [serviceData, setServiceData] = useState([]);
  const [sportCategories, setSportCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("cat_drinks");
  const [cart, setCart] = useState([]);
  const [selectedSportKey, setSelectedSportKey] = useState(null);

  // Fetch services and sport categories
  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchSportCategories();
      setCart([]);
      setActiveCategory("cat_drinks");
      setSelectedSportKey(null);
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceApi.getAllServices({ isActive: true });
      if (response.success) {
        const services = response.data || [];
        // Group services by type
        const groupedServices = groupServicesByType(services);
        setServiceData(groupedServices);
        
        // Set first category as active if available
        if (groupedServices.length > 0) {
          setActiveCategory(groupedServices[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Không thể tải danh sách dịch vụ");
      setServiceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSportCategories = async () => {
    try {
      const response = await categoryApi.getSportCategories({ status: "active" });
      if (response.success) {
        const categories = response.data || [];
        // Map to format expected by modal
        const mappedCategories = categories.map((cat) => ({
          key: cat._id || cat.id,
          name: cat.name,
          _id: cat._id || cat.id,
        }));
        setSportCategories(mappedCategories);
        
        // Set first sport as selected if available
        if (mappedCategories.length > 0 && court?.sportCategory) {
          // Try to match court's sport category
          const courtSportId = court.sportCategory?._id || court.sportCategory;
          const matchedSport = mappedCategories.find(
            (s) => s._id === courtSportId || s.key === courtSportId
          );
          setSelectedSportKey(matchedSport ? matchedSport.key : mappedCategories[0].key);
        } else if (mappedCategories.length > 0) {
          setSelectedSportKey(mappedCategories[0].key);
        }
      }
    } catch (error) {
      console.error("Error fetching sport categories:", error);
      setSportCategories([]);
    }
  };

  const groupServicesByType = (services) => {
    const grouped = {
      cat_drinks: { id: "cat_drinks", name: "Nước uống", items: [] },
      cat_snacks: { id: "cat_snacks", name: "Đồ ăn vặt", items: [] },
      cat_rentals: { id: "cat_rentals", name: "Thuê đồ & Dụng cụ", items: [] },
    };

    services.forEach((service) => {
      const categoryId = TYPE_TO_CATEGORY[service.type];
      if (categoryId) {
        const item = {
          _id: service._id,
          name: service.name,
          price: service.price,
          imageUrl: service.image || null,
          description: service.description,
          // For EQUIPMENT, store sportCategory info
          sportCategory: service.sportCategory?._id || service.sportCategory || null,
          sportCategoryName: service.sportCategory?.name || null,
        };
        grouped[categoryId].items.push(item);
      }
    });

    // Return only categories that have items
    return Object.values(grouped).filter((cat) => cat.items.length > 0);
  };

  if (!isOpen || !court) return null;

  // --- LOGIC LỌC MỚI (DỰA TRÊN STATE 'selectedSportKey') ---
  const categoryItems = serviceData.find((cat) => cat.id === activeCategory)?.items || [];
  let currentItems = categoryItems;

  if (activeCategory === "cat_rentals" && selectedSportKey) {
    // Filter equipment by selected sport category
    // Show items that match the selected sport or have no sport category (all sports)
    currentItems = categoryItems.filter(
      (item) =>
        !item.sportCategory || // No sport category = available for all sports
        item.sportCategory === selectedSportKey || // Matches selected sport
        item.sportCategory._id === selectedSportKey || // Handle populated object
        String(item.sportCategory) === String(selectedSportKey) // String comparison
    );
  }
  // --- KẾT THÚC LOGIC LỌC ---

  const addToCart = (service) => {
    setCart((currentCart) => {
      const itemExists = currentCart.find((item) => item._id === service._id);
      if (itemExists) {
        return currentCart.map((item) =>
          item._id === service._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...currentCart, { ...service, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (serviceId) => {
    setCart((currentCart) => currentCart.filter((item) => item._id !== serviceId));
  };

  const updateQuantity = (serviceId, delta) => {
    setCart((currentCart) => {
      const newCart = currentCart.map((item) => {
        if(item._id === serviceId){
          const newQty = item.quantity + delta;
          return{...item, quantity: newQty};
        }
        return item;
      });
      return newCart.filter(item => item.quantity > 0);
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50 p-4">
          <div>
            <h2 className="text-xl font-bold text-blue-900">Dịch vụ sân: {court.name}</h2>
            <p className="text-sm text-blue-700">Chọn đồ ăn, thức uống hoặc dụng cụ</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-blue-600 hover:bg-blue-100">
            <X size={24} />
          </button>
        </div>


        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Cột 1: DANH MỤC */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-2 space-y-1">
              {serviceData.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                    activeCategory === cat.id
                      ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-gray-600 hover:bg-blue-50" 
                  }`}
                >
                  {CATEGORY_ICONS[cat.id]}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cột 2: DANH SÁCH SẢN PHẨM */}
          <div className="flex-1 overflow-y-auto bg-white p-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-3 text-gray-600">Đang tải dịch vụ...</span>
              </div>
            ) : (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  {serviceData.find((c) => c.id === activeCategory)?.name || "Dịch vụ"}
                </h3>
                
                {activeCategory === "cat_rentals" && sportCategories.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {sportCategories.map((sport) => (
                      <button
                        key={sport.key || sport._id}
                        onClick={() => setSelectedSportKey(sport.key || sport._id)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                          selectedSportKey === (sport.key || sport._id)
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        {sport.name}
                      </button>
                    ))}
                  </div>
                )}


                {/* === ĐÂY LÀ DÒNG QUAN TRỌNG === */}
                <div className="grid grid-cols-3 gap-4">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => addToCart(item)}
                        className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md active:scale-95"
                      >
                        <div className="mb-3 h-24 w-full overflow-hidden rounded-lg bg-gray-100 group-hover:bg-blue-50">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="flex h-full w-full items-center justify-center text-gray-400 group-hover:text-blue-500"
                            style={{
                              display: item.imageUrl ? "none" : "flex",
                            }}
                          >
                            <ShoppingCart size={32} />
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <p className="mt-1 font-bold text-blue-700">
                          {item.price.toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-500 py-10">
                      <p>
                        {activeCategory === "cat_rentals"
                          ? "Không có dụng cụ nào cho môn thể thao này."
                          : "Không có dịch vụ nào trong danh mục này."}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cột 3: GIỎ HÀNG */}
          <div className="flex w-80 flex-col border-l border-gray-200 bg-white">
            <div className="border-b border-gray-100 p-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <ShoppingCart size={20} />
                Đơn hàng hiện tại
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={48} className="mb-2 opacity-20" />
                  <p>Chưa có dịch vụ nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 transition-colors">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = "flex";
                            }
                          }}
                        />
                      )}
                      <div
                        className="h-12 w-12 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-gray-400"
                        style={{ display: item.imageUrl ? "none" : "flex" }}
                      >
                        <ShoppingCart size={20} />
                      </div>

                      <div className="flex-1 overflow-hidden min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.price.toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                      
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1">
                          <button 
                            onClick={() => updateQuantity(item._id, -1)}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            title="Giảm số lượng"
                          >
                            -
                          </button>
                          <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item)}
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            title="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Giỏ hàng */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex justify-between text-lg font-bold">
                <span>Tổng tiền:</span>
                <span className="text-blue-700">
                  {total.toLocaleString("vi-VN")} đ
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onSave(court, cart)}
                  disabled={cart.length === 0}
                  className={`rounded-lg py-3 font-semibold text-white transition-colors ${ 
                    cart.length === 0 
                      ? "cursor-not-allowed bg-gray-300" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Lưu & Thanh toán
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourtServiceModal;