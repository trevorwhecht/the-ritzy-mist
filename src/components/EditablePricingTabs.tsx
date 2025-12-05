'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PricingData, 
  PricingItem, 
  loadPricingData, 
  savePricingData, 
  defaultPricingData 
} from '@/lib/pricingData'
import ConfirmDialog from './ConfirmDialog'

interface EditablePricingTabsProps {
  className?: string
}

const EditablePricingTabs: React.FC<EditablePricingTabsProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('inStudio')
  const [pricingData, setPricingData] = useState<PricingData | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingGroupItem, setEditingGroupItem] = useState<number | null>(null)
  const [editingGroupSection, setEditingGroupSection] = useState<number | null>(null)
  const [editingAddOn, setEditingAddOn] = useState<{ tab: 'inStudio' | 'mobile', index: number } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    type: 'service', 
    data: { tab: 'inStudio' | 'mobile', id: string }
  } | {
    type: 'groupItem',
    data: { index: number }
  } | {
    type: 'addOn',
    data: { tab: 'inStudio' | 'mobile', index: number }
  } | null>(null)

  // Load pricing data on mount - always prioritize saved data
  useEffect(() => {
    const loaded = loadPricingData()
    setPricingData(loaded)
  }, [])

  // Save pricing data whenever it changes (but not on initial load)
  useEffect(() => {
    if (pricingData !== null) {
      savePricingData(pricingData)
    }
  }, [pricingData])

  const tabs = [
    { id: 'inStudio', label: 'IN STUDIO SPRAY' },
    { id: 'mobile', label: 'MOBILE SPRAY' },
    { id: 'group', label: 'GROUP SPRAY' }
  ]

  // Service editing functions
  const handleAddService = (tab: 'inStudio' | 'mobile') => {
    if (!pricingData) return
    
    const newService: PricingItem = {
      id: `new-${Date.now()}`,
      title: 'New Service',
      description: 'Service description',
      price: '$0',
      link: ''
    }
    setPricingData({
      ...pricingData,
      [tab]: {
        ...pricingData[tab],
        services: [...pricingData[tab].services, newService]
      }
    })
    setEditingId(newService.id)
  }

  const handleDeleteService = (tab: 'inStudio' | 'mobile', id: string) => {
    setDeleteConfirm({
      type: 'service',
      data: { tab, id }
    })
  }

  const confirmDelete = () => {
    if (!deleteConfirm || !pricingData) return

    if (deleteConfirm.type === 'service') {
      const { tab, id } = deleteConfirm.data
      const tabData = pricingData[tab]
      setPricingData({
        ...pricingData,
        [tab]: {
          ...tabData,
          services: tabData.services.filter(s => s.id !== id)
        }
      })
    } else if (deleteConfirm.type === 'groupItem') {
      const { index } = deleteConfirm.data
      setPricingData({
        ...pricingData,
        group: {
          ...pricingData.group,
          items: pricingData.group.items.filter((_, i) => i !== index)
        }
      })
    } else if (deleteConfirm.type === 'addOn') {
      const { tab, index } = deleteConfirm.data
      const tabData = pricingData[tab]
      if (tabData.addOns) {
        const newItems = tabData.addOns.items.filter((_, i) => i !== index)
        setPricingData({
          ...pricingData,
          [tab]: {
            ...tabData,
            addOns: {
              ...tabData.addOns,
              items: newItems
            }
          }
        })
      }
    }

    setDeleteConfirm(null)
    setEditingId(null)
  }

  const handleUpdateService = (tab: 'inStudio' | 'mobile', id: string, field: keyof PricingItem, value: string) => {
    if (!pricingData) return
    
    setPricingData({
      ...pricingData,
      [tab]: {
        ...pricingData[tab],
        services: pricingData[tab].services.map(s =>
          s.id === id ? { ...s, [field]: value } : s
        )
      }
    })
  }

  // Add-ons editing functions
  const handleAddAddOn = (tab: 'inStudio' | 'mobile') => {
    if (!pricingData) return
    
    if (!pricingData[tab].addOns) {
      setPricingData({
        ...pricingData,
        [tab]: {
          ...pricingData[tab],
          addOns: {
            title: 'Add-On Menu',
            description: '*Mix & match up to 3 additives max*',
            items: []
          }
        }
      })
    }

    const newAddOn = {
      title: 'New Add-On',
      description: 'Add-on description',
      price: '$0'
    }

    setPricingData({
      ...pricingData,
      [tab]: {
        ...pricingData[tab],
        addOns: {
          ...pricingData[tab].addOns!,
          items: [...(pricingData[tab].addOns?.items || []), newAddOn]
        }
      }
    })
    setEditingAddOn({ tab, index: pricingData[tab].addOns?.items.length || 0 })
  }

  const handleUpdateAddOn = (tab: 'inStudio' | 'mobile', index: number, field: 'title' | 'description' | 'price', value: string) => {
    if (!pricingData || !pricingData[tab].addOns) return
    
    setPricingData({
      ...pricingData,
      [tab]: {
        ...pricingData[tab],
        addOns: {
          ...pricingData[tab].addOns!,
          items: pricingData[tab].addOns!.items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
          )
        }
      }
    })
  }

  const handleUpdateAddOnsMeta = (tab: 'inStudio' | 'mobile', field: 'title' | 'description', value: string) => {
    if (!pricingData || !pricingData[tab].addOns) return
    
    setPricingData({
      ...pricingData,
      [tab]: {
        ...pricingData[tab],
        addOns: {
          ...pricingData[tab].addOns!,
          [field]: value
        }
      }
    })
  }

  const handleDeleteAddOn = (tab: 'inStudio' | 'mobile', index: number) => {
    setDeleteConfirm({
      type: 'addOn',
      data: { tab, index }
    })
  }

  // Group editing functions
  const handleAddGroupItem = () => {
    if (!pricingData) return
    
    setPricingData({
      ...pricingData,
      group: {
        ...pricingData.group,
        items: [...pricingData.group.items, { label: 'New Item', value: '$0' }]
      }
    })
    setEditingGroupItem(pricingData.group.items.length)
  }

  const handleDeleteGroupItem = (index: number) => {
    setDeleteConfirm({
      type: 'groupItem',
      data: { index }
    })
  }

  const handleUpdateGroupItem = (index: number, field: 'label' | 'value', value: string) => {
    if (!pricingData) return
    
    setPricingData({
      ...pricingData,
      group: {
        ...pricingData.group,
        items: pricingData.group.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    })
  }

  const handleUpdateGroupSection = (index: number, field: 'title' | 'content', value: string) => {
    if (!pricingData) return
    
    setPricingData({
      ...pricingData,
      group: {
        ...pricingData.group,
        sections: pricingData.group.sections.map((section, i) =>
          i === index ? { ...section, [field]: value } : section
        )
      }
    })
  }

  const handleUpdateGroupHeader = (value: string) => {
    if (!pricingData) return
    
    setPricingData({
      ...pricingData,
      group: {
        ...pricingData.group,
        header: value
      }
    })
  }

  const handleUpdateGroupFooter = (field: 'title' | 'content', value: string) => {
    if (!pricingData || !pricingData.group.footer) return
    setPricingData({
      ...pricingData,
      group: {
        ...pricingData.group,
        footer: {
          ...pricingData.group.footer,
          [field]: value
        }
      }
    })
  }

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset all pricing data to default? This cannot be undone.')) {
      localStorage.removeItem('ritzy-mist-pricing-data')
      setPricingData(defaultPricingData)
    }
  }

  const renderEditableService = (service: PricingItem, tab: 'inStudio' | 'mobile') => {
    const isEditing = editingId === service.id

    return (
      <div key={service.id} className="border-b border-gray-600 pb-4 relative">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={service.title}
              onChange={(e) => handleUpdateService(tab, service.id, 'title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-2xl font-bold text-[#d59586]"
              placeholder="Service Title"
              autoFocus
            />
            <textarea
              value={service.description}
              onChange={(e) => handleUpdateService(tab, service.id, 'description', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300 min-h-[100px]"
              placeholder="Service Description"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={service.price}
                onChange={(e) => handleUpdateService(tab, service.id, 'price', e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
                placeholder="Price (e.g., $55)"
              />
              <input
                type="text"
                value={service.link || ''}
                onChange={(e) => handleUpdateService(tab, service.id, 'link', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
                placeholder="Link (optional)"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => handleDeleteService(tab, service.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Disable link clicks in edit mode */}
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="cursor-default"
              >
                <h3 className="text-2xl font-bold text-[#d59586] mb-2">
                  {service.title} — {service.price}
                </h3>
              </div>
              <p className="text-gray-300">{service.description}</p>
            </div>
            <div className="flex gap-2 items-start">
              <button
                onClick={() => setEditingId(service.id)}
                className="px-3 py-1 bg-[#d59586] text-white text-sm rounded hover:opacity-80 transition-opacity"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteService(tab, service.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-bold"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderEditableAddOns = (tab: 'inStudio' | 'mobile') => {
    if (!pricingData || !pricingData[tab].addOns) return null

    const addOns = pricingData[tab].addOns

    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          {editingAddOn?.tab === tab && editingAddOn.index === -1 ? (
            <input
              type="text"
              value={addOns.title}
              onChange={(e) => handleUpdateAddOnsMeta(tab, 'title', e.target.value)}
              className="text-2xl font-bold text-[#d59586] bg-gray-800 border border-[#d59586] rounded px-3 py-2"
              onBlur={() => setEditingAddOn(null)}
              autoFocus
            />
          ) : (
            <h3 
              className="text-2xl font-bold text-[#d59586] cursor-pointer hover:opacity-80"
              onClick={() => setEditingAddOn({ tab, index: -1 })}
            >
              {addOns.title}
            </h3>
          )}
        </div>
        
        {addOns.description && (
          <div className="mb-4">
            {editingAddOn?.tab === tab && editingAddOn.index === -2 ? (
              <textarea
                value={addOns.description}
                onChange={(e) => handleUpdateAddOnsMeta(tab, 'description', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-gray-400"
                onBlur={() => setEditingAddOn(null)}
                autoFocus
              />
            ) : (
              <p 
                className="text-gray-400 cursor-pointer hover:opacity-80"
                onClick={() => setEditingAddOn({ tab, index: -2 })}
              >
                {addOns.description}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {addOns.items.map((item, index) => (
            <div key={index} className="border-b border-gray-700 pb-4 relative">
              {editingAddOn?.tab === tab && editingAddOn.index === index ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateAddOn(tab, index, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-xl font-bold text-white"
                    autoFocus
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) => handleUpdateAddOn(tab, index, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300 min-h-[60px]"
                  />
                  {item.price && (
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => handleUpdateAddOn(tab, index, 'price', e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
                      placeholder="Price"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAddOn(null)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDeleteAddOn(tab, index)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAddOn({ tab, index })}
                      className="px-3 py-1 bg-[#d59586] text-white text-sm rounded hover:opacity-80 transition-opacity"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddOn(tab, index)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-bold"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => handleAddAddOn(tab)}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          + Add Add-On
        </button>
      </div>
    )
  }

  // Wait for data to load
  if (pricingData === null) {
    return <div className={`text-white ${className}`}>Loading...</div>
  }

  return (
    <div className={`text-white ${className}`}>
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
      />

      {/* Reset Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleResetToDefault}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
        >
          Reset to Default
        </button>
      </div>

      {/* Folder-style tabs */}
      <div className="relative mb-0 max-w-4xl mx-auto">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              className="relative flex-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => {
                  setActiveTab(tab.id)
                  setEditingId(null)
                  setEditingGroupItem(null)
                  setEditingGroupSection(null)
                  setEditingAddOn(null)
                }}
                className={`relative px-2 md:px-6 py-3 rounded-t-lg text-xs md:text-base transition-all duration-300 border-2 w-full font-[AlegreyaSansSC] ${
                  activeTab === tab.id
                    ? 'bg-stone-800 text-white border-white z-10'
                    : 'bg-black text-white border-white hover:bg-gray-900'
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-stone-800 rounded-t-lg border-2 border-white"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tab Content Areas */}
      <div className="relative">
        {/* In Studio Spray Tab */}
        {activeTab === 'inStudio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border border-white rounded-b-lg p-6 font-[AlegreyaSansSC] max-w-4xl mx-auto"
          >
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#d59586]">Services</h3>
                <button
                  onClick={() => handleAddService('inStudio')}
                  className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 font-semibold"
                >
                  + Add Service
                </button>
              </div>

              <div className="space-y-6">
                {pricingData.inStudio.services.map(service => renderEditableService(service, 'inStudio'))}
              </div>

              {renderEditableAddOns('inStudio')}
            </div>
          </motion.div>
        )}

        {/* Mobile Spray Tab */}
        {activeTab === 'mobile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border border-white rounded-b-lg p-6 font-[AlegreyaSansSC] max-w-4xl mx-auto"
          >
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#d59586]">Services</h3>
                <button
                  onClick={() => handleAddService('mobile')}
                  className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 font-semibold"
                >
                  + Add Service
                </button>
              </div>

              <div className="space-y-6">
                {pricingData.mobile.services.map(service => renderEditableService(service, 'mobile'))}
              </div>

              {renderEditableAddOns('mobile')}
            </div>
          </motion.div>
        )}

        {/* Group Spray Tab */}
        {activeTab === 'group' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border border-white rounded-b-lg p-6 font-[AlegreyaSansSC] max-w-4xl mx-auto"
          >
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center mb-8">
                {editingGroupSection === -1 ? (
                  <textarea
                    value={pricingData.group.header || ''}
                    onChange={(e) => handleUpdateGroupHeader(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-3xl font-bold text-[#d59586] text-center"
                    placeholder="Header text"
                    onBlur={() => setEditingGroupSection(null)}
                    autoFocus
                  />
                ) : (
                  <h3 
                    className="text-3xl font-bold text-[#d59586] mb-4 cursor-pointer hover:opacity-80"
                    onClick={() => setEditingGroupSection(-1)}
                  >
                    {pricingData.group.header}
                  </h3>
                )}
              </div>

              {/* Group Items */}
              <div className="space-y-6">
                <div className="border-b border-gray-600 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-2xl font-bold text-white">Individual pricing within groups:</h4>
                    <button
                      onClick={handleAddGroupItem}
                      className="px-3 py-1 bg-white text-black text-sm rounded hover:bg-gray-200 font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {pricingData.group.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        {editingGroupItem === index ? (
                          <div className="flex gap-2 flex-1">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => handleUpdateGroupItem(index, 'label', e.target.value)}
                              className="flex-1 px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-xl font-bold text-white"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => handleUpdateGroupItem(index, 'value', e.target.value)}
                              className="px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-xl font-bold text-[#d59586]"
                            />
                            <button
                              onClick={() => setEditingGroupItem(null)}
                              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteGroupItem(index)
                                setEditingGroupItem(null)
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <span 
                              className="text-xl font-bold cursor-pointer hover:opacity-80"
                              onClick={() => setEditingGroupItem(index)}
                            >
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-xl font-bold text-[#d59586] cursor-pointer hover:opacity-80"
                                onClick={() => setEditingGroupItem(index)}
                              >
                                {item.value}
                              </span>
                              <button
                                onClick={() => setEditingGroupItem(index)}
                                className="px-3 py-1 bg-[#d59586] text-white text-sm rounded hover:opacity-80 transition-opacity"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteGroupItem(index)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-bold"
                                title="Delete"
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                {pricingData.group.sections.map((section, index) => (
                  <div key={index} className="border-b border-gray-600 pb-4">
                    {editingGroupSection === index ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleUpdateGroupSection(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-[#d59586] rounded text-xl font-bold text-white"
                          autoFocus
                        />
                        <textarea
                          value={section.content}
                          onChange={(e) => handleUpdateGroupSection(index, 'content', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
                        />
                        <button
                          onClick={() => setEditingGroupSection(null)}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 
                          className="text-xl font-bold text-white mb-2 cursor-pointer hover:opacity-80"
                          onClick={() => setEditingGroupSection(index)}
                        >
                          {section.title}
                        </h4>
                        <p 
                          className="text-gray-300 cursor-pointer hover:opacity-80"
                          onClick={() => setEditingGroupSection(index)}
                        >
                          {section.content}
                        </p>
                      </>
                    )}
                  </div>
                ))}

                {/* Footer */}
                {pricingData.group.footer && (
                  <div className="bg-gray-800 p-6 rounded-lg mt-8">
                    {editingGroupSection === -2 ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={pricingData.group.footer.title}
                          onChange={(e) => handleUpdateGroupFooter('title', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-[#d59586] rounded text-xl font-bold text-[#d59586]"
                          autoFocus
                        />
                        <textarea
                          value={pricingData.group.footer.content}
                          onChange={(e) => handleUpdateGroupFooter('content', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-300"
                        />
                        <button
                          onClick={() => setEditingGroupSection(null)}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 
                          className="text-xl font-bold text-[#d59586] mb-2 cursor-pointer hover:opacity-80"
                          onClick={() => setEditingGroupSection(-2)}
                        >
                          {pricingData.group.footer.title}
                        </h4>
                        <p 
                          className="text-gray-300 cursor-pointer hover:opacity-80"
                          onClick={() => setEditingGroupSection(-2)}
                        >
                          {pricingData.group.footer.content}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default EditablePricingTabs
