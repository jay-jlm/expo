/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTComponentViewRegistry.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewComponentView.h>
#import <XCTest/XCTest.h>

@interface ABI44_0_0RCTComponentViewRegistryTests : XCTestCase
@end

using namespace ABI44_0_0facebook::ABI44_0_0React;

@implementation ABI44_0_0RCTComponentViewRegistryTests {
  ABI44_0_0RCTComponentViewRegistry *_componentViewRegistry;
}

- (void)setUp
{
  [super setUp];
  _componentViewRegistry = [ABI44_0_0RCTComponentViewRegistry new];
}

- (void)testComponentViewDescriptorWithTag
{
  XCTAssertThrows(
      ^{
        Tag nonExistingTag = 12;
        [self->_componentViewRegistry componentViewDescriptorWithTag:nonExistingTag];
      }(),
      @"Should throw: `Attempt to query unregistered component`");

  Tag existingTag = 2;
  auto newViewDescriptor = [_componentViewRegistry
      dequeueComponentViewWithComponentHandle:[ABI44_0_0RCTViewComponentView componentDescriptorProvider].handle
                                          tag:existingTag];

  XCTAssertNoThrow(^{
    auto componentDescriptor = [self->_componentViewRegistry componentViewDescriptorWithTag:existingTag];
    XCTAssertEqual(newViewDescriptor, componentDescriptor);
  }());
}

- (void)testFindComponentViewWithTag
{
  Tag nonExistingTag = 12;
  XCTAssertNil([_componentViewRegistry findComponentViewWithTag:nonExistingTag]);

  Tag existingTag = 2;
  auto newViewDescriptor = [_componentViewRegistry
      dequeueComponentViewWithComponentHandle:[ABI44_0_0RCTViewComponentView componentDescriptorProvider].handle
                                          tag:existingTag];

  XCTAssertEqual(newViewDescriptor.view, [_componentViewRegistry findComponentViewWithTag:existingTag]);
}

- (void)testDequeueAndEnqueue
{
  Tag existingTag = 2;
  auto newViewDescriptor = [_componentViewRegistry
      dequeueComponentViewWithComponentHandle:[ABI44_0_0RCTViewComponentView componentDescriptorProvider].handle
                                          tag:existingTag];

  XCTAssertThrows(
      ^{
        [self->_componentViewRegistry
            dequeueComponentViewWithComponentHandle:[ABI44_0_0RCTViewComponentView componentDescriptorProvider].handle
                                                tag:existingTag];
      }(),
      @"Should throw: `Attempt to dequeue already registered component`");

  XCTAssertThrows(
      ^{
        Tag nonExistingTag = 12;
        [self->_componentViewRegistry
            enqueueComponentViewWithComponentHandle:[ABI44_0_0RCTViewComponentView componentDescriptorProvider].handle
                                                tag:nonExistingTag
                            componentViewDescriptor:newViewDescriptor];
      }(),
      @"Should throw: `Attempt to enqueue unregistered component`");
}

@end
