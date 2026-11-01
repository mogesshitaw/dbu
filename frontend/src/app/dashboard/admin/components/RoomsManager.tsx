/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Title,
  Text,
  Table,
  Button,
  Group,
  ActionIcon,
  Modal,
  Select,
  NumberInput,
  Loader,
  Alert,
  Badge,
  Stack,
  Grid,
  Paper,
  Input,
  Menu,
} from "@mantine/core";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  HomeModernIcon,
  CheckIcon,
  XMarkIcon,

  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchRooms,
  fetchBlocks,
  fetchFloors,
  addRoom,
  updateRoom,
  deleteRoom,
  clearError,
  clearSuccessMessage,
  Room,
  RoomFormData,
} from "@/store/slices/roomsSlice";
import { Found, Authentication, UnauthorizedAccess } from "@/app/auth/auth";

const RoomsManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { rooms, blocks, floors, loading, error, successMessage } = useAppSelector((state) => state.rooms);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [minCapacity, setMinCapacity] = useState<number | "">("");
  const [maxCapacity, setMaxCapacity] = useState<number | "">("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"room_number" | "capacity" | "block_name">("room_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const form = useForm({
    initialValues: {
      block_id: "",
      floor_id: "",
      room_number: "",
      room_type: "classroom",
      capacity: 30,
      is_available: true,
    },
    validate: {
      block_id: (value) => (value ? null : "Block is required"),
      floor_id: (value) => (value ? null : "Floor is required"),
      room_number: (value) => (value.trim().length < 1 ? "Room number is required" : null),
      room_type: (value) => (value ? null : "Room type is required"),
    },
  });

  // Room type options
  const roomTypeOptions = [
    { value: "classroom", label: "Classroom / Lecture Hall" },
    { value: "lab", label: "Laboratory (Lab)" },
     { value: "office", label: "office " },

  ];

  // Facilities options

  const blockOptions = useMemo(() => [
    { value: '', label: 'All blocks' },
    ...(Array.isArray(blocks)
      ? blocks
        .filter(block => block && block.block_id)
        .map(block => ({
          value: block.block_id.toString(),
          label: block.block_name || `Block ${block.block_id}`
        }))
      : []
    )
  ], [blocks]);

  // Facilities filter (REMOVED as it is not in the DB)

  // Fetch data on component mount
  useEffect(() => {
    console.log("Dispatching fetch actions...");
    dispatch(fetchRooms());
    dispatch(fetchBlocks());
    dispatch(fetchFloors());
  }, [dispatch]);

  // Clear messages after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    setActionLoading(true);
    try {
      const payload: RoomFormData = {
        floor_id: parseInt(values.floor_id),
        room_number: values.room_number.trim(),
        room_type: values.room_type,
        capacity: values.capacity && values.capacity > 0 ? values.capacity : undefined,
        is_available: values.is_available,
      };

      console.log('Submitting room data:', payload);

      if (editingRoom) {
        await dispatch(updateRoom({
          roomId: editingRoom.room_id,
          roomData: payload
        })).unwrap();
      } else {
        await dispatch(addRoom(payload)).unwrap();
      }

      setModalOpened(false);
      form.reset();
      setEditingRoom(null);
      dispatch(fetchRooms());
    } catch (err) {
      console.error('Error in handleSubmit:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Block options for form
  const blockOption = blocks.map(block => ({
    value: block.block_id.toString(),
    label: `${block.block_name} (${block.block_code})`
  }));

  // Handle edit
  const handleEdit = (room: Room) => {
    console.log('Editing room:', room);
    setEditingRoom(room);

    // Find the floor to set block_id
    const floor = floors.find(f => f.floor_id === room.floor_id);

    form.setValues({
      block_id: floor?.block_id?.toString() || "",
      floor_id: room.floor_id?.toString(),
      room_number: room.room_number,
      room_type: room.room_type,
      capacity: room.capacity || 30,
      is_available: room.is_available,
    });
    setModalOpened(true);
  };

  // Handle delete
  const handleDelete = async (roomId: number) => {
    if (!confirm("Are you sure you want to delete this room?")) {
      return;
    }

    setActionLoading(true);
    try {
      console.log('Deleting room with ID:', roomId);
      await dispatch(deleteRoom(roomId)).unwrap();
      dispatch(fetchRooms());
    } catch (err) {
      console.error('Error in handleDelete:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingRoom(null);
    form.reset();
  };

  const getRoomTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      classroom: "blue",
      lec: "blue",
      lab: "green",
      office: "orange",
      conference: "purple",
      library: "cyan",
      auditorium: "red",
      other: "gray",
    };
    return colors[type] || "gray";
  };

  // Format room type for display
  const formatRoomType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      classroom: "Lecture Hall",
      lec: "Lecture Hall",
      lab: "Laboratory",
      office: "Office",
      conference: "Conference Room",
      library: "Library",
      auditorium: "Auditorium",
      other: "Other",
    };
    return typeMap[type] || type;
  };

  // Filter rooms based on all criteria
  const filteredRooms = useMemo(() => {
    let filtered = [...rooms];

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => {
        const roomNumber = room.room_number?.toLowerCase() || '';
        const blockName = room.block_name?.toLowerCase() || '';

        return (
          roomNumber.includes(query) ||
          blockName.includes(query)
        );
      });
    }

    // Block filter
    if (selectedBlock) {
      filtered = filtered.filter(room => room.block_id === parseInt(selectedBlock));
    }

    // Floor filter
    if (selectedFloor) {
      filtered = filtered.filter(room => room.floor_id === parseInt(selectedFloor));
    }

    // Room type filter
    if (selectedRoomType) {
      filtered = filtered.filter(room => room.room_type === selectedRoomType);
    }

    // Capacity filters
    if (minCapacity !== "") {
      filtered = filtered.filter(room => (room.capacity || 0) >= minCapacity);
    }
    if (maxCapacity !== "") {
      filtered = filtered.filter(room => (room.capacity || 0) <= maxCapacity);
    }

    // Status filter
    if (selectedStatus) {
      const isAvailable = selectedStatus === "available";
      filtered = filtered.filter(room => room.is_available === isAvailable);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "room_number":
          aValue = a.room_number;
          bValue = b.room_number;
          break;
        case "capacity":
          aValue = a.capacity || 0;
          bValue = b.capacity || 0;
          break;
        case "block_name":
          aValue = a.block_name;
          bValue = b.block_name;
          break;
        default:
          aValue = a.room_number;
          bValue = b.room_number;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rooms, searchQuery, selectedBlock, selectedFloor, selectedRoomType, minCapacity, maxCapacity, selectedStatus, sortBy, sortOrder]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBlock(null);
    setSelectedFloor(null);
    setSelectedRoomType(null);
    setMinCapacity("");
    setMaxCapacity("");
    setSelectedStatus(null);
    setSelectedFacilities([]);
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return searchQuery ||
      selectedBlock ||
      selectedFloor ||
      selectedRoomType ||
      minCapacity !== "" ||
      maxCapacity !== "" ||
      selectedStatus ||
      selectedFacilities.length > 0;
  };
 const [currentuser, setcurrentUser] = useState<any>(null);
       useEffect(() => {
         const checkAuth = async () => {
           const foundUser = await Found();
           setcurrentUser(foundUser);
         };
         checkAuth();
       }, []);
  
      if (currentuser === null ) { 
        return <Authentication />;
    }
      if (currentuser?.role !== 'admin') {
        return <UnauthorizedAccess />
      }
  return (
    <div className="space-y-6">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2} className="text-gray-900">
            Rooms Management
          </Title>
          <Text c="dimmed">Manage rooms across all floors and blocks</Text>
        </div>
        <Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                variant="light"
                color="blue"
                rightSection={<ChevronDownIcon className="h-4 w-4" />}
              >
                Manage
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Navigation</Menu.Label>
              <Menu.Item
                leftSection={<BuildingStorefrontIcon className="h-4 w-4" />}
                onClick={() => router.push('/dashboard/admin/block')}
              >
                Manage Blocks
              </Menu.Item>
              <Menu.Item
                leftSection={<BuildingOfficeIcon className="h-4 w-4" />}
                onClick={() => router.push('/dashboard/admin/floor')}
              >
                Manage Floors
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item
                leftSection={<PlusIcon className="h-4 w-4" />}
                onClick={() => setModalOpened(true)}
              >
                Add New Room
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button
            leftSection={<PlusIcon className="h-5 w-5" />}
            onClick={() => setModalOpened(true)}
            loading={loading}
          >
            Add Room
          </Button>
        </Group>
      </Group>

      {/* Search and Filter Section */}
      <Card withBorder radius="md" className="relative">
        <Stack gap="md">
          {/* Search Bar */}
          <Group>
            <Input
              placeholder="Search by room number, name, or block..."
              leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              rightSection={
                searchQuery && (
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => setSearchQuery("")}
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </ActionIcon>
                )
              }
            />
            <Button
              variant="light"
              leftSection={<FunnelIcon className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "blue" : "gray"}
            >
              Filters {hasActiveFilters() && `(${filteredRooms.length}/${rooms.length})`}
            </Button>
            <Button
              variant="subtle"
              leftSection={<ArrowsUpDownIcon className="h-4 w-4" />}
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              Sort {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
            {hasActiveFilters() && (
              <Button
                variant="subtle"
                color="red"
                leftSection={<XCircleIcon className="h-4 w-4" />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Group>

          {/* Filters Panel */}
          {showFilters && (
            <Paper withBorder p="md" className="bg-gray-50">
              <Stack gap="md">
                <Group align="flex-start" grow>
                  {/* Block Filter */}
                  <Select
                    label="Filter by Block"
                    placeholder="All blocks"
                    data={blockOptions}
                    value={selectedBlock}
                    onChange={(value) => {
                      setSelectedBlock(value);
                      setSelectedFloor(null); // Reset floor when block changes
                    }}
                    clearable
                    searchable
                  />

                  {/* Floor Filter */}
                  <Select
                    label="Filter by Floor"
                    placeholder="All floors"
                    data={floors
                      .filter(f => !selectedBlock || f.block_id === parseInt(selectedBlock))
                      .map(f => ({ value: f.floor_id.toString(), label: `G${f.floor_number} (${f.block_code})` }))
                    }
                    value={selectedFloor}
                    onChange={setSelectedFloor}
                    clearable
                    searchable
                  />

                  {/* Room Type Filter */}
                  <Select
                    label="Filter by Room Type"
                    placeholder="All types"
                    data={roomTypeOptions}
                    value={selectedRoomType}
                    onChange={setSelectedRoomType}
                    clearable
                  />

                  {/* Status Filter */}
                  <Select
                    label="Filter by Status"
                    placeholder="All statuses"
                    data={[
                      { value: "available", label: "Available" },
                      { value: "unavailable", label: "Unavailable" },
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    clearable
                  />
                </Group>

                <Group align="flex-start" grow>
                  {/* Capacity Range */}
                  <div>
                    <Text size="sm" fw={500} mb="xs">Capacity Range</Text>
                    <Group>
                      <NumberInput
                        placeholder="Min"
                        value={minCapacity}
                        onChange={(value) => setMinCapacity(value === '' ? '' : Number(value))} min={1}
                        className="flex-1"
                      />
                      <Text size="sm">to</Text>
                      <NumberInput
                        placeholder="Max"
                        value={maxCapacity}
                        onChange={(value) => setMaxCapacity(value === '' ? '' : Number(value))}
                        min={1}
                        className="flex-1"
                      />
                    </Group>
                  </div>
                </Group>

                {/* Sort Options */}
                <div>
                  <Text size="sm" fw={500} mb="xs">Sort By</Text>
                  <Group>
                    {[
                      { value: "room_number", label: "Room Number" },
                      { value: "capacity", label: "Capacity" },
                      { value: "block_name", label: "Block Name" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? "filled" : "light"}
                        size="xs"
                        onClick={() => setSortBy(option.value as any)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Group>
                </div>
              </Stack>
            </Paper>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <Paper withBorder p="sm" className="bg-blue-50">
              <Group gap="xs">
                <Text size="sm" fw={500}>Active Filters:</Text>
                {searchQuery && (
                  <Badge variant="light" color="blue">
                    Search: {searchQuery}
                  </Badge>
                )}
                {selectedBlock && (
                  <Badge variant="light" color="green">
                    Block: {blocks.find(b => b.block_id === parseInt(selectedBlock || "0"))?.block_name || selectedBlock}
                  </Badge>
                )}
                {selectedFloor && (
                  <Badge variant="light" color="cyan">
                    Floor: G{floors.find(f => f.floor_id === parseInt(selectedFloor || "0"))?.floor_number}
                  </Badge>
                )}
                {selectedRoomType && (
                  <Badge variant="light" color="orange">
                    Type: {formatRoomType(selectedRoomType)}
                  </Badge>
                )}
                {selectedStatus && (
                  <Badge variant="light" color={selectedStatus === "available" ? "green" : "red"}>
                    Status: {selectedStatus === "available" ? "Available" : "Unavailable"}
                  </Badge>
                )}
                {(minCapacity !== "" || maxCapacity !== "") && (
                  <Badge variant="light" color="cyan">
                    Capacity: {minCapacity !== "" ? `≥${minCapacity}` : ""}
                    {minCapacity !== "" && maxCapacity !== "" && " - "}
                    {maxCapacity !== "" ? `≤${maxCapacity}` : ""}
                  </Badge>
                )}
              </Group>
            </Paper>
          )}
        </Stack>
      </Card>

      {/* Stats Summary */}
      <Group grow>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Total Rooms</Text>
          <Title order={3}>{rooms.length}</Title>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Filtered Rooms</Text>
          <Title order={3}>{filteredRooms.length}</Title>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Available Rooms</Text>
          <Title order={3}>{rooms.filter(r => r.is_available).length}</Title>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Blocks</Text>
          <Title order={3}>{blockOptions.length}</Title>
        </Card>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert color="red" title="Error" withCloseButton onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert color="green" title="Success" withCloseButton onClose={() => dispatch(clearSuccessMessage())}>
          {successMessage}
        </Alert>
      )}

      {/* Rooms Table */}
      <Card withBorder radius="md">
        {loading && rooms.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
            <Text ml="md">Loading rooms...</Text>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <HomeModernIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <Text c="dimmed" size="lg" mb="md">
              {hasActiveFilters() ? "No rooms match your filters" : "No rooms found"}
            </Text>
            {hasActiveFilters() ? (
              <Button
                variant="light"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                leftSection={<PlusIcon className="h-5 w-5" />}
                onClick={() => setModalOpened(true)}
                disabled={blocks.length === 0}
                loading={loading}
              >
                Add Your First Room
              </Button>
            )}
          </div>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Room Number</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Capacity</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRooms.map((room, index) => (
                  <Table.Tr key={room.room_id}>
                    <Table.Td>
                      <Text fw={500}>{index + 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{room.room_number}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {room.block_code}-G{room.floor_number}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={getRoomTypeColor(room.room_type)}>
                        {formatRoomType(room.room_type)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text>{room.capacity || "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={room.is_available ? "green" : "red"}
                        variant="light"
                        leftSection={
                          room.is_available ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <XMarkIcon className="h-3 w-3" />
                          )
                        }
                      >
                        {room.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleEdit(room)}
                          disabled={actionLoading}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDelete(room.room_id)}
                          disabled={actionLoading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingRoom ? `Edit Room - ${editingRoom.room_number}` : "Add New Room"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Block"
              placeholder="Select a block"
              data={blockOption}
              required
              searchable
              nothingFoundMessage="No block found"
              {...form.getInputProps("block_id")}
              onChange={(value) => {
                form.setFieldValue("block_id", value || "");
                form.setFieldValue("floor_id", "");
                form.setFieldValue("room_number", "");
              }}
            />
            <Select
              label="Floor"
              placeholder="Select a floor"
              data={floors
                .filter(f => f.block_id === parseInt(form.values.block_id))
                .map(f => ({ value: f.floor_id.toString(), label: `G${f.floor_number}` }))
              }
              required
              disabled={!form.values.block_id}
              {...form.getInputProps("floor_id")}
              onChange={(value) => {
                form.setFieldValue("floor_id", value || "");
                form.setFieldValue("room_number", "");
              }}
            />
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Room Number"
                  placeholder="Select room number"
                  data={(() => {
                    const floor = floors.find(f => f.floor_id === parseInt(form.values.floor_id));
                    if (!floor || !floor.room_capacity) return [];

                    // Generate all possible room numbers
                    const allRooms = Array.from({ length: floor.room_capacity }, (_, i) => {
                      const num = (i + 1).toString().padStart(2, '0');
                      return { value: `R${num}`, label: `R${num}` };
                    });

                    // Filter out already registered rooms (except when editing)
                    const existingRoomNumbers = rooms.filter(r => r.floor_id === parseInt(form.values.floor_id) && (!editingRoom || r.room_id !== editingRoom.room_id))
                      .map(r => r.room_number);

                    return allRooms.filter(ar => !existingRoomNumbers.includes(ar.value));
                  })()}
                  required
                  disabled={!form.values.floor_id}
                  {...form.getInputProps("room_number")}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Room Type"
                  data={roomTypeOptions}
                  required
                  {...form.getInputProps("room_type")}
                />
              </Grid.Col>
            </Grid>

            <NumberInput
              label="Capacity"
              placeholder="Number of people"
              min={1}
              {...form.getInputProps("capacity")}
            />

            <Select
              label="Availability"
              data={[
                { value: "true", label: "Available" },
                { value: "false", label: "Unavailable" },
              ]}
              value={form.values.is_available.toString()}
              onChange={(value) => form.setFieldValue("is_available", value === "true")}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={actionLoading}
              >
                {editingRoom ? "Update Room" : "Add Room"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};

export default RoomsManager;