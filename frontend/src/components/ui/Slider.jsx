import React, { useRef, useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { debounce } from '../../utils/optimization'
import './Slider.css'

export default function Slider({ children, className = '', itemWidth = 320, gap = 16, loop = false, autoPlay = false, autoPlayInterval = 3000, mobileItemWidth = null }) {
    const scrollContainerRef = useRef(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [calculatedItemWidth, setCalculatedItemWidth] = useState(itemWidth)
    const isScrollingRef = useRef(false)
    const autoPlayTimerRef = useRef(null)
    const scrollTimeoutRef = useRef(null)
    const pendingScrollRef = useRef(null)

    // Convert children to array for easier manipulation
    const childrenArray = useMemo(() => {
        return React.Children.toArray(children)
    }, [children])

    // Calculate responsive itemWidth for mobile
    useEffect(() => {
        const calculateItemWidth = () => {
            const width = window.innerWidth
            const isMobileDevice = width <= 768
            
            setIsMobile(isMobileDevice)
            
            if (isMobileDevice) {
                // On mobile, calculate width based on viewport minus padding
                // Default: viewport width - 32px (16px padding on each side) - gap
                if (mobileItemWidth !== null) {
                    setCalculatedItemWidth(mobileItemWidth)
                } else {
                    // Auto-calculate: use 85% of viewport width for better mobile UX
                    const containerPadding = 32 // 16px on each side
                    const calculated = Math.floor((width - containerPadding - gap) * 0.85)
                    setCalculatedItemWidth(Math.max(calculated, 280)) // Minimum 280px
                }
            } else {
                setCalculatedItemWidth(itemWidth)
            }
        }

        calculateItemWidth()
        const debouncedResize = debounce(calculateItemWidth, 150)
        window.addEventListener('resize', debouncedResize)
        
        return () => {
            window.removeEventListener('resize', debouncedResize)
        }
    }, [itemWidth, mobileItemWidth, gap])

    // For infinite loop, duplicate items
    const duplicatedChildren = useMemo(() => {
        if (!loop || childrenArray.length === 0) return childrenArray
        return [...childrenArray, ...childrenArray, ...childrenArray]
    }, [loop, childrenArray])

    const checkScrollButtons = () => {
        if (scrollContainerRef.current && !loop) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        } else if (loop) {
            // Always show buttons in loop mode
            setCanScrollLeft(true)
            setCanScrollRight(true)
        }
    }

    const handleInfiniteScroll = () => {
        if (!loop || !scrollContainerRef.current || childrenArray.length === 0) return

        const container = scrollContainerRef.current
        const { scrollLeft } = container
        const itemWidthWithGap = calculatedItemWidth + gap
        const singleSetWidth = itemWidthWithGap * childrenArray.length

        // Calculate which set we're in (0 = first, 1 = middle, 2 = last)
        const currentSet = Math.floor(scrollLeft / singleSetWidth)
        
        // If we're in the first set (set 0) or beyond the last set (set 2+), jump to middle
        // Remove isScrollingRef check here to allow jump even during programmatic scroll
        if (currentSet === 0 || currentSet >= 2) {
            // Prevent infinite loop by checking if we're already jumping
            if (isScrollingRef.current) return
            
            isScrollingRef.current = true
            container.style.scrollBehavior = 'auto'
            
            // Calculate offset within the current set
            const offsetInSet = scrollLeft % singleSetWidth
            // Snap to exact card position within the middle set
            const cardIndex = Math.round(offsetInSet / itemWidthWithGap)
            const snapPosition = singleSetWidth + (cardIndex * itemWidthWithGap)
            
            container.scrollLeft = snapPosition
            
            requestAnimationFrame(() => {
                setTimeout(() => {
                    container.style.scrollBehavior = 'smooth'
                    isScrollingRef.current = false
                }, 50)
            })
        }
    }

    useEffect(() => {
        // Delay to ensure DOM is ready and content is populated
        const timer = setTimeout(() => {
            checkScrollButtons()
            
            // Initialize scroll position for loop mode
            if (loop && scrollContainerRef.current && childrenArray.length > 0) {
                const container = scrollContainerRef.current
                // Wait for layout to be calculated
                requestAnimationFrame(() => {
                    const itemWidthWithGap = calculatedItemWidth + gap
                    const singleSetWidth = itemWidthWithGap * childrenArray.length
                    // Start at the middle set (second set) to allow scrolling in both directions
                    container.style.scrollBehavior = 'auto'
                    container.scrollLeft = singleSetWidth
                    // Reset scroll behavior after initialization
                    setTimeout(() => {
                        container.style.scrollBehavior = 'smooth'
                    }, 100)
                })
            }
        }, 150)

        const container = scrollContainerRef.current
        if (container) {
            const debouncedCheck = debounce(() => {
                checkScrollButtons()
                handleInfiniteScroll()
            }, 200)

            const scrollHandler = () => {
                checkScrollButtons()
                // Always check infinite scroll, even during programmatic scrolling
                // This ensures loop continues to work even after many clicks
                handleInfiniteScroll()
            }

            container.addEventListener('scroll', scrollHandler)
            window.addEventListener('resize', debouncedCheck)

            return () => {
                clearTimeout(timer)
                container.removeEventListener('scroll', scrollHandler)
                window.removeEventListener('resize', debouncedCheck)
            }
        }
        return () => clearTimeout(timer)
    }, [children, loop, calculatedItemWidth, gap, childrenArray.length])

    // Auto-play functionality
    useEffect(() => {
        if (autoPlay && loop && childrenArray.length > 0) {
            autoPlayTimerRef.current = setInterval(() => {
                if (scrollContainerRef.current && !isScrollingRef.current) {
                    const scrollAmount = calculatedItemWidth + gap
                    scrollContainerRef.current.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    })
                }
            }, autoPlayInterval)

            return () => {
                if (autoPlayTimerRef.current) {
                    clearInterval(autoPlayTimerRef.current)
                }
            }
        }
    }, [autoPlay, loop, autoPlayInterval, calculatedItemWidth, gap, childrenArray.length])

    const scroll = (direction) => {
        if (!scrollContainerRef.current) return

        // If currently scrolling, queue this scroll
        if (isScrollingRef.current) {
            pendingScrollRef.current = direction
            return
        }

        const scrollAmount = calculatedItemWidth + gap
        const container = scrollContainerRef.current
        const currentScroll = container.scrollLeft
        
        // For loop mode, ensure we snap to exact card positions
        let targetScroll
        if (loop) {
            // Calculate which card we're currently at (snap to nearest card)
            const currentCardIndex = Math.round(currentScroll / scrollAmount)
            const nextCardIndex = direction === 'left' 
                ? currentCardIndex - 1 
                : currentCardIndex + 1
            targetScroll = nextCardIndex * scrollAmount
        } else {
            targetScroll = direction === 'left'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount
        }

        // Mark as scrolling to prevent rapid clicks
        isScrollingRef.current = true

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        })

        // Reset after scroll completes and ensure snap to exact position
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            // Ensure we're at exact card position (snap correction)
            if (loop && container) {
                const finalScroll = container.scrollLeft
                const snapPosition = Math.round(finalScroll / scrollAmount) * scrollAmount
                if (Math.abs(finalScroll - snapPosition) > 1) {
                    container.style.scrollBehavior = 'auto'
                    container.scrollLeft = snapPosition
                    container.style.scrollBehavior = 'smooth'
                }
                
                // Check infinite scroll after scroll completes to ensure loop continues
                setTimeout(() => {
                    handleInfiniteScroll()
                }, 100)
            }
            
            isScrollingRef.current = false
            
            // Process any queued scroll
            if (pendingScrollRef.current) {
                const queuedDirection = pendingScrollRef.current
                pendingScrollRef.current = null
                setTimeout(() => scroll(queuedDirection), 100)
            }
        }, 600) // Wait for smooth scroll to complete
    }

    const displayChildren = loop ? duplicatedChildren : childrenArray

    return (
        <div className={`ui-slider-container ${className} ${isMobile ? 'ui-slider-container-mobile' : ''}`}>
            {(canScrollLeft || loop) && !isMobile && (
                <button
                    className="ui-slider-btn ui-slider-btn-left"
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            <div
                ref={scrollContainerRef}
                className={`ui-slider-track ${loop ? 'ui-slider-loop' : ''} ${isMobile ? 'ui-slider-mobile' : ''}`}
                style={{ gap: `${gap}px` }}
            >
                {displayChildren.map((child, index) => (
                    <div 
                        key={loop ? `loop-${index}` : child.key || index}
                        style={{ 
                            flex: `0 0 ${calculatedItemWidth}px`,
                            width: `${calculatedItemWidth}px`
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {(canScrollRight || loop) && !isMobile && (
                <button
                    className="ui-slider-btn ui-slider-btn-right"
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    )
}
