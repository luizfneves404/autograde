import {
	Box,
	Button,
	Flex,
	Heading,
	Input,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { AddClassForm } from "@/components/AddClassForm";
import { ClassActions } from "@/components/ClassActions";
import { ClassEditor } from "@/components/ClassEditor";
import { ClassView } from "@/components/ClassView";
import OfferingEditor from "@/components/OfferingEditor";
import type {
	ClassIdentifier,
	ClassOffering,
	ClassOfferingIdentifier,
	CourseClass,
} from "@/types";

interface ClassSectionProps {
	courseCode: string;
	classes: CourseClass[];
	editingClassId: ClassIdentifier | null;
	onAddClass: (newClassData: Omit<CourseClass, "courseCode">) => void;
	onUpdateClass: (classId: ClassIdentifier, updatedData: CourseClass) => void;
	onDeleteClass: (classId: ClassIdentifier) => void;
	onSetEditingClass: (classId: ClassIdentifier | null) => void;
	onAddOffering: (
		classId: ClassIdentifier,
		newOfferingData: Omit<ClassOffering, "courseCode" | "classCode">,
	) => void;
	onUpdateOffering: (
		offeringId: ClassOfferingIdentifier,
		updatedData: Partial<Pick<ClassOffering, "vacancyCount">>,
	) => void;
	onDeleteOffering: (offeringId: ClassOfferingIdentifier) => void;
}

export function ClassSection({
	courseCode,
	classes,
	editingClassId,
	onAddClass,
	onUpdateClass,
	onDeleteClass,
	onSetEditingClass,
	onAddOffering,
	onUpdateOffering,
	onDeleteOffering,
}: ClassSectionProps) {
	const [editingOfferingId, setEditingOfferingId] =
		useState<ClassOfferingIdentifier | null>(null);

	return (
		<Box mt={6} pl={4} borderLeftWidth="2px" borderColor="gray.200">
			<Heading size="md" mb={4}>
				Turmas de {courseCode}
			</Heading>

			<AddClassForm onAddClass={onAddClass} />

			<VStack gap={4} mt={4} align="stretch">
				{classes.length === 0 ? (
					<Box
						textAlign="center"
						color="gray.500"
						p={4}
						bg="gray.100"
						borderRadius="md"
					>
						Nenhuma turma cadastrada para esta disciplina.
					</Box>
				) : (
					classes.map((courseClass) => {
						const currentClassId: ClassIdentifier = {
							courseCode: courseClass.courseCode,
							classCode: courseClass.classCode,
						};
						const isEditingClass =
							editingClassId?.classCode === currentClassId.classCode &&
							editingClassId?.courseCode === currentClassId.courseCode;

						return (
							<Box
								key={currentClassId.classCode}
								p={4}
								bg="white"
								borderRadius="lg"
								shadow="sm"
								borderWidth="1px"
								borderColor="gray.200"
							>
								{isEditingClass ? (
									<ClassEditor
										courseClass={courseClass}
										onSave={(updated) => {
											onUpdateClass(currentClassId, updated);
										}}
										onCancel={() => {
											onSetEditingClass(null);
										}}
									/>
								) : (
									<>
										{/* Class Details and Actions */}
										<Flex justify="space-between" align="flex-start">
											<ClassView courseClass={courseClass} />
											<ClassActions
												onEdit={() => {
													onSetEditingClass(currentClassId);
												}}
												onDelete={() => {
													onDeleteClass(currentClassId);
												}}
											/>
										</Flex>

										{/* Offerings Management Section */}
										<Box
											mt={4}
											pt={3}
											borderTopWidth="1px"
											borderColor="gray.200"
										>
											<Heading size="sm" color="gray.700" mb={2}>
												Oferta de Vagas
											</Heading>
											<VStack gap={2} align="stretch">
												{courseClass.offerings.map((offering) => {
													const currentOfferingId: ClassOfferingIdentifier = {
														...currentClassId,
														destCode: offering.destCode,
													};
													const isEditingOffering =
														editingOfferingId?.destCode ===
															currentOfferingId.destCode &&
														editingOfferingId?.classCode ===
															currentOfferingId.classCode;

													return (
														<Box key={offering.destCode}>
															{isEditingOffering ? (
																<OfferingEditor
																	offering={offering}
																	onSave={(updatedData) => {
																		onUpdateOffering(
																			currentOfferingId,
																			updatedData,
																		);
																		setEditingOfferingId(null);
																	}}
																	onCancel={() => {
																		setEditingOfferingId(null);
																	}}
																/>
															) : (
																<Flex
																	justify="space-between"
																	align="center"
																	p={2}
																	bg="gray.50"
																	borderRadius="md"
																>
																	<Text fontSize="sm">
																		<Text
																			as="span"
																			fontWeight="medium"
																			color="gray.800"
																		>
																			{offering.destCode}:
																		</Text>{" "}
																		{offering.vacancyCount} vagas
																	</Text>
																	<Flex gap={2}>
																		<Button
																			onClick={() => {
																				setEditingOfferingId(currentOfferingId);
																			}}
																			size="sm"
																			colorPalette="blue"
																		>
																			Editar
																		</Button>
																		<Button
																			onClick={() => {
																				onDeleteOffering(currentOfferingId);
																			}}
																			size="sm"
																			colorPalette="red"
																		>
																			Excluir
																		</Button>
																	</Flex>
																</Flex>
															)}
														</Box>
													);
												})}
											</VStack>

											{/* Add New Offering Form */}
											<form
												onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
													e.preventDefault();
													const formData = new FormData(e.currentTarget);
													const destCode = formData.get("destCode") as string;
													const vacancyCount = parseInt(
														formData.get("vacancyCount") as string,
														10,
													);

													if (destCode?.trim() && !isNaN(vacancyCount)) {
														onAddOffering(currentClassId, {
															destCode: destCode.trim().toUpperCase(),
															vacancyCount,
														});
														e.currentTarget.reset();
													}
												}}
												style={{ marginTop: "0.75rem" }}
											>
												<Flex gap={2}>
													<Input
														name="destCode"
														placeholder="Código Destino"
														w="24"
														required
													/>
													<Input
														name="vacancyCount"
														type="number"
														placeholder="Vagas"
														w="24"
														required
													/>
													<Button type="submit" size="sm" variant="outline">
														Adicionar
													</Button>
												</Flex>
											</form>
										</Box>
									</>
								)}
							</Box>
						);
					})
				)}
			</VStack>
		</Box>
	);
}
