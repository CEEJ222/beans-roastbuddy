'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, Search } from 'lucide-react'
import BeanDetailModal from './bean-detail-modal'

interface CoffeeProfile {
  id: string
  name: string | null
  vendor: string | null
  vendor_product_id: string | null
  vendor_url: string | null
  country: string | null
  region: string | null
  sub_region: string | null
  producer: string | null
  variety: string | null
  process_method: string | null
  altitude_min_m: number | null
  altitude_max_m: number | null
  flavor_notes: string[] | null
  vendor_description: string | null
  roasting_notes: string | null
  recommended_roast_levels: string[] | null
  body_intensity: number | null
  acidity_intensity: number | null
  price_per_lb: number | null
  arrival_date: string | null
  screen_size: string | null
  cupping_score: number | null
  bean_type: string | null
  espresso_suitable: boolean | null
  status: string
  created_at: string
  scraped_at: string | null
}

export default function AllBeansClient({ initialProfiles }: { initialProfiles: CoffeeProfile[] }) {
  const [profiles, setProfiles] = useState<CoffeeProfile[]>(initialProfiles)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [processFilter, setProcessFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('created_desc')
  const [selectedProfile, setSelectedProfile] = useState<CoffeeProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleProfileUpdate = (updatedProfile: CoffeeProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    )
    setSelectedProfile(updatedProfile)
  }

  // Get unique values for filters
  const uniqueVendors = useMemo(() => {
    const vendors = new Set(profiles.map((p) => p.vendor).filter((v): v is string => Boolean(v)))
    return Array.from(vendors).sort()
  }, [profiles])

  const uniqueCountries = useMemo(() => {
    const countries = new Set(profiles.map((p) => p.country).filter((c): c is string => Boolean(c)))
    return Array.from(countries).sort()
  }, [profiles])

  const uniqueProcesses = useMemo(() => {
    const processes = new Set(profiles.map((p) => p.process_method).filter((p): p is string => Boolean(p)))
    return Array.from(processes).sort()
  }, [profiles])

  const filteredAndSortedProfiles = useMemo(() => {
    let filtered = [...profiles]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((profile) => profile.status === statusFilter)
    }

    // Vendor filter
    if (vendorFilter !== 'all') {
      filtered = filtered.filter((profile) => profile.vendor === vendorFilter)
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter((profile) => profile.country === countryFilter)
    }

    // Process filter
    if (processFilter !== 'all') {
      filtered = filtered.filter((profile) => profile.process_method === processFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((profile) => {
        const searchableFields = [
          profile.name,
          profile.vendor,
          profile.country,
          profile.region,
          profile.sub_region,
          profile.producer,
          profile.variety,
          profile.process_method,
          profile.flavor_notes?.join(' '),
        ].filter(Boolean).join(' ').toLowerCase()

        return searchableFields.includes(query)
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '')
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '')
        case 'vendor_asc':
          return (a.vendor || '').localeCompare(b.vendor || '')
        case 'vendor_desc':
          return (b.vendor || '').localeCompare(a.vendor || '')
        case 'country_asc':
          return (a.country || '').localeCompare(b.country || '')
        case 'country_desc':
          return (b.country || '').localeCompare(a.country || '')
        case 'price_asc':
          return (a.price_per_lb || 0) - (b.price_per_lb || 0)
        case 'price_desc':
          return (b.price_per_lb || 0) - (a.price_per_lb || 0)
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'created_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [profiles, statusFilter, vendorFilter, countryFilter, processFilter, searchQuery, sortBy])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }

  const handleViewDetails = (profile: CoffeeProfile) => {
    setSelectedProfile(profile)
    setIsModalOpen(true)
  }

  const statusCounts = useMemo(() => {
    const counts = {
      all: profiles.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    }
    profiles.forEach((profile) => {
      if (counts.hasOwnProperty(profile.status)) {
        counts[profile.status as keyof typeof counts]++
      }
    })
    return counts
  }, [profiles])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Green Coffee Catalog</h1>
              <p className="mt-2 text-gray-600">
                {filteredAndSortedProfiles.length} profile{filteredAndSortedProfiles.length !== 1 ? 's' : ''} 
                {filteredAndSortedProfiles.length !== initialProfiles.length && ` of ${initialProfiles.length}`}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, vendor, country, region, producer, variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {uniqueVendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={processFilter} onValueChange={setProcessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Process" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Processes</SelectItem>
                  {uniqueProcesses.map((process) => (
                    <SelectItem key={process} value={process}>
                      {process}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Newest First</SelectItem>
                  <SelectItem value="created_asc">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="vendor_asc">Vendor (A-Z)</SelectItem>
                  <SelectItem value="vendor_desc">Vendor (Z-A)</SelectItem>
                  <SelectItem value="country_asc">Country (A-Z)</SelectItem>
                  <SelectItem value="country_desc">Country (Z-A)</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(statusFilter !== 'all' || vendorFilter !== 'all' || countryFilter !== 'all' || processFilter !== 'all' || searchQuery) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600">Active filters:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {vendorFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Vendor: {vendorFilter}
                    <button
                      onClick={() => setVendorFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {countryFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Country: {countryFilter}
                    <button
                      onClick={() => setCountryFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {processFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Process: {processFilter}
                    <button
                      onClick={() => setProcessFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all')
                    setVendorFilter('all')
                    setCountryFilter('all')
                    setProcessFilter('all')
                    setSearchQuery('')
                  }}
                  className="h-6 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {filteredAndSortedProfiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              No profiles found matching your filters
            </p>
            {(statusFilter !== 'all' || vendorFilter !== 'all' || countryFilter !== 'all' || processFilter !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setStatusFilter('all')
                  setVendorFilter('all')
                  setCountryFilter('all')
                  setProcessFilter('all')
                  setSearchQuery('')
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Process</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.name || 'Unnamed Coffee'}
                      </TableCell>
                      <TableCell>{profile.vendor || '-'}</TableCell>
                      <TableCell>{profile.country || '-'}</TableCell>
                      <TableCell>
                        {profile.region || '-'}
                        {profile.sub_region && `, ${profile.sub_region}`}
                      </TableCell>
                      <TableCell>{profile.process_method || '-'}</TableCell>
                      <TableCell>
                        {profile.price_per_lb
                          ? `$${profile.price_per_lb.toFixed(2)}/lb`
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(profile.status)}</TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(profile)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {selectedProfile && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bean Details</DialogTitle>
                <DialogDescription>
                  View detailed information about this coffee profile
                </DialogDescription>
              </DialogHeader>
              <BeanDetailModal
                profile={selectedProfile}
                onClose={() => setIsModalOpen(false)}
                onUpdate={handleProfileUpdate}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
