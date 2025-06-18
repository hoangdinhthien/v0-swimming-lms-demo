"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function PromotionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newPromotion, setNewPromotion] = useState({
    code: "",
    title: "",
    discount: "",
    endDate: "",
    limit: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock promotions data
  const promotions = [
    {
      id: 1,
      code: "SUMMER2025",
      title: "Summer Special",
      discount: "20% off",
      startDate: "May 1, 2025",
      endDate: "Aug 31, 2025",
      usageCount: "45/100",
      status: "Active",
    },
    {
      id: 2,
      code: "WELCOME10",
      title: "New Student Discount",
      discount: "10% off",
      startDate: "Jan 1, 2025",
      endDate: "Dec 31, 2025",
      usageCount: "210/500",
      status: "Active",
    },
    {
      id: 3,
      code: "FAMILY25",
      title: "Family Package",
      discount: "25% off for 3+ students",
      startDate: "Mar 15, 2025",
      endDate: "Dec 31, 2025",
      usageCount: "18/50",
      status: "Active",
    },
    {
      id: 4,
      code: "SPRING15",
      title: "Spring Promotion",
      discount: "15% off",
      startDate: "Mar 1, 2025",
      endDate: "May 30, 2025",
      usageCount: "82/100",
      status: "Expiring Soon",
    },
    {
      id: 5,
      code: "WINTER2024",
      title: "Winter Special",
      discount: "20% off",
      startDate: "Dec 1, 2024",
      endDate: "Feb 28, 2025",
      usageCount: "120/120",
      status: "Expired",
    },
  ];

  // Filter promotions based on search query and status filter
  const filteredPromotions = promotions.filter((promo) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    const matchesStatus =
      statusFilter === "all" ||
      promo.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Handle adding a new promotion
  const handleAddPromotion = () => {
    console.log("Adding new promotion:", newPromotion);
    // Here you would typically make an API call to add the promotion
    setIsAddDialogOpen(false);
    setNewPromotion({
      code: "",
      title: "",
      discount: "",
      endDate: "",
      limit: "",
    });
  };

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Promotions</h1>
          <p className='text-muted-foreground'>
            Manage discounts and special offers for your swimming courses
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
              <DialogDescription>
                Fill in the details for the new promotional offer.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label
                  htmlFor='promo-code'
                  className='text-right'
                >
                  Code
                </Label>
                <Input
                  id='promo-code'
                  placeholder='SUMMER25'
                  className='col-span-3'
                  value={newPromotion.code}
                  onChange={(e) =>
                    setNewPromotion({ ...newPromotion, code: e.target.value })
                  }
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label
                  htmlFor='promo-title'
                  className='text-right'
                >
                  Title
                </Label>
                <Input
                  id='promo-title'
                  placeholder='Summer Special'
                  className='col-span-3'
                  value={newPromotion.title}
                  onChange={(e) =>
                    setNewPromotion({ ...newPromotion, title: e.target.value })
                  }
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label
                  htmlFor='promo-discount'
                  className='text-right'
                >
                  Discount
                </Label>
                <Input
                  id='promo-discount'
                  placeholder='20% off'
                  className='col-span-3'
                  value={newPromotion.discount}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      discount: e.target.value,
                    })
                  }
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label
                  htmlFor='promo-end'
                  className='text-right'
                >
                  End Date
                </Label>
                <Input
                  id='promo-end'
                  type='date'
                  className='col-span-3'
                  value={newPromotion.endDate}
                  onChange={(e) =>
                    setNewPromotion({
                      ...newPromotion,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label
                  htmlFor='promo-limit'
                  className='text-right'
                >
                  Usage Limit
                </Label>
                <Input
                  id='promo-limit'
                  type='number'
                  placeholder='100'
                  className='col-span-3'
                  value={newPromotion.limit}
                  onChange={(e) =>
                    setNewPromotion({ ...newPromotion, limit: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddPromotion}>Create Promotion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className='mt-8 flex flex-col gap-4 md:flex-row'>
        <div className='flex flex-1 items-center gap-2'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search promotions...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='max-w-sm'
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='expiring soon'>Expiring Soon</SelectItem>
            <SelectItem value='expired'>Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Promotions Table */}
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='rounded-md overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className='font-medium'>{promo.code}</TableCell>
                    <TableCell>{promo.title}</TableCell>
                    <TableCell>{promo.discount}</TableCell>
                    <TableCell>
                      <span className='block text-xs text-muted-foreground'>
                        {promo.startDate}
                      </span>
                      <span className='block'>to {promo.endDate}</span>
                    </TableCell>
                    <TableCell>{promo.usageCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={
                          promo.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : promo.status === "Expiring Soon"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {promo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                        >
                          Edit
                        </Button>
                        {promo.status !== "Expired" && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-red-500 hover:text-red-700'
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className='grid gap-6 mt-8 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {promotions.filter((p) => p.status === "Active").length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Current offers available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>355</div>
            <p className='text-xs text-muted-foreground'>
              Promotion codes used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            {" "}
            <div className='text-2xl font-bold'>$12,450</div>
            <p className='text-xs text-muted-foreground'>
              Discount value applied
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
